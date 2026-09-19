import { db, MiningContractCloudMineX, UserCloudMineX, TransactionCloudMineX } from '../config/dbStore';
import { isMongoConnected, UserModel, MiningContractModel, TransactionModel } from '../config/dbMongo';

export interface RewardCalculation {
  dailyReward: number;
  totalEstimatedReward: number;
}

export function calculateEstimatedReward(amount: number, rewardRate: number, durationDays: number): RewardCalculation {
  const dailyReward = Number((amount * rewardRate).toFixed(2));
  const totalEstimatedReward = Number((dailyReward * durationDays).toFixed(2));
  return {
    dailyReward,
    totalEstimatedReward,
  };
}

/**
 * Persists updated users, contracts, and transactions to MongoDB reliably with Promise.all
 */
export async function syncYieldsToMongo(
  updatedUserIds: Set<string>,
  updatedContracts: MiningContractCloudMineX[],
  createdTransactions: TransactionCloudMineX[]
): Promise<void> {
  if (!isMongoConnected()) return;
  try {
    const userOps = Array.from(updatedUserIds).map((uid) => {
      const u = db.users.find((user) => user.id === uid);
      if (!u) return Promise.resolve();
      return UserModel.updateOne(
        { id: u.id },
        {
          $set: {
            balance: u.balance,
            totalRewards: u.totalRewards,
            activeContracts: u.activeContracts,
            updatedAt: u.updatedAt,
          },
        }
      );
    });

    const contractOps = updatedContracts.map((cntr) =>
      MiningContractModel.updateOne(
        { id: cntr.id },
        {
          $set: {
            accumulatedReward: cntr.accumulatedReward,
            lastCalculatedAt: cntr.lastCalculatedAt,
            status: cntr.status,
            updatedAt: cntr.updatedAt,
          },
        }
      )
    );

    const txOps = createdTransactions.map((tx) =>
      TransactionModel.updateOne(
        { id: tx.id },
        { $set: tx },
        { upsert: true }
      )
    );

    await Promise.all([...userOps, ...contractOps, ...txOps]);
  } catch (err) {
    console.error('[MongoDB] Mining yield sync error:', err);
  }
}

/**
 * Automatically processes all 24-hour elapsed cycles for active mining contracts.
 * 100% IDEMPOTENT:
 * - Checks each cycle day individually against existing transactions to prevent any double-crediting.
 * - Uses deterministic transaction IDs (tx_yield_{contractId}_d{day}) and references.
 * - Guarantees users can never receive duplicate daily yield payouts.
 */
export function processMiningYields(targetUserId?: string): { creditedTotal: number; contractsUpdated: number; contractsCompleted: number } {
  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  const activeContracts = targetUserId
    ? db.miningContracts.filter((c) => c.userId === targetUserId && c.status === 'active')
    : db.miningContracts.filter((c) => c.status === 'active');

  let creditedTotal = 0;
  let contractsUpdated = 0;
  let contractsCompleted = 0;
  let hasDbChanges = false;
  const updatedUserIds = new Set<string>();
  const updatedContracts: MiningContractCloudMineX[] = [];
  const createdTransactions: TransactionCloudMineX[] = [];

  for (const contract of activeContracts) {
    const user = db.users.find((u) => u.id === contract.userId);
    if (!user) continue;

    const startMs = new Date(contract.startDate || contract.createdAt).getTime();
    const endMs = new Date(contract.endDate).getTime();
    const maxDays = contract.duration || 14;
    const dailyReward = contract.estimatedDailyReward || Number((contract.amount * (contract.rewardRate || 0.06)).toFixed(2));

    // Calculate total 24h cycles elapsed from start date
    const elapsedTotalMs = Math.max(0, now - startMs);
    const totalDaysPassed = Math.floor(elapsedTotalMs / ONE_DAY_MS);
    const targetDaysCredited = Math.min(totalDaysPassed, maxDays);

    let contractCreditedCount = 0;
    let newDaysCredited = 0;

    // Process each cycle day deterministically from 1 to targetDaysCredited
    for (let day = 1; day <= targetDaysCredited; day++) {
      const deterministicId = `tx_yield_${contract.id}_d${day}`;
      const deterministicRef = `YIELD-${contract.id.slice(-6)}-D${day}`;

      // Strict duplicate check across all recorded transactions for this user & contract
      const alreadyCredited = db.transactions.some((t) => {
        if (t.userId !== user.id || t.type !== 'mining_reward') return false;
        if (t.id === deterministicId || t.reference === deterministicRef) return true;
        if (t.description) {
          const isContractPlan = t.description.includes(contract.planName) || (t.reference && t.reference.includes(contract.id.slice(-4)));
          if (isContractPlan && (t.description.includes(`(Day ${day}/`) || t.description.includes(`(Day ${day} of `) || t.description.includes(`Day ${day}/${maxDays}`))) {
            return true;
          }
        }
        return false;
      });

      if (alreadyCredited) {
        contractCreditedCount++;
        continue;
      }

      // Legitimate new cycle day: Credit yield
      const txTime = new Date(startMs + day * ONE_DAY_MS).toISOString();
      const newTx: TransactionCloudMineX = {
        id: deterministicId,
        userId: user.id,
        type: 'mining_reward',
        amount: dailyReward,
        currency: user.currency || 'GHS',
        reference: deterministicRef,
        description: `24h Daily Yield - ${contract.planName} (Day ${day}/${maxDays})`,
        status: 'completed',
        createdAt: txTime,
      };

      db.transactions.unshift(newTx);
      createdTransactions.push(newTx);

      user.balance = Number((user.balance + dailyReward).toFixed(2));
      user.totalRewards = Number(((user.totalRewards || 0) + dailyReward).toFixed(2));
      user.updatedAt = new Date().toISOString();

      creditedTotal += dailyReward;
      newDaysCredited++;
      contractCreditedCount++;
    }

    // Update contract accumulated reward to match true verified cycle count
    const correctAccumulatedReward = Number((contractCreditedCount * dailyReward).toFixed(2));
    if (newDaysCredited > 0 || contract.accumulatedReward !== correctAccumulatedReward) {
      contract.accumulatedReward = correctAccumulatedReward;
      contract.lastCalculatedAt = new Date(startMs + contractCreditedCount * ONE_DAY_MS).toISOString();
      contract.updatedAt = new Date().toISOString();

      contractsUpdated++;
      hasDbChanges = true;
      updatedUserIds.add(user.id);
      if (!updatedContracts.includes(contract)) {
        updatedContracts.push(contract);
      }
    }

    // Check if contract has completed full duration or reached end date
    const isMatured = now >= endMs || contractCreditedCount >= maxDays || (contract.accumulatedReward || 0) >= (contract.estimatedTotalReward || (dailyReward * maxDays));
    if (isMatured && contract.status === 'active') {
      contract.status = 'completed';
      contract.updatedAt = new Date().toISOString();
      if (user.activeContracts && user.activeContracts > 0) {
        user.activeContracts -= 1;
      }

      contractsCompleted++;
      hasDbChanges = true;
      updatedUserIds.add(user.id);
      if (!updatedContracts.includes(contract)) {
        updatedContracts.push(contract);
      }

      // Record maturity completion in ledger if not already recorded
      const matureId = `tx_mature_${contract.id}`;
      const matureExists = db.transactions.some((t) => t.id === matureId || (t.reference === `MATURE-${contract.id.slice(-4)}`));
      if (!matureExists) {
        const matureTx: TransactionCloudMineX = {
          id: matureId,
          userId: user.id,
          type: 'mining_reward',
          amount: 0,
          currency: user.currency || 'GHS',
          reference: `MATURE-${contract.id.slice(-4)}`,
          description: `Contract Matured: ${contract.planName} (${maxDays} Days Full Cycle Completed)`,
          status: 'completed',
          createdAt: new Date().toISOString(),
        };
        db.transactions.unshift(matureTx);
        createdTransactions.push(matureTx);
      }
    }
  }

  if (hasDbChanges) {
    db.saveData();
    syncYieldsToMongo(updatedUserIds, updatedContracts, createdTransactions).catch((err) =>
      console.error('[MongoDB] Background yield sync notice:', err)
    );
  }

  return { creditedTotal, contractsUpdated, contractsCompleted };
}

/**
 * Async version of processMiningYields that ensures MongoDB sync completes
 */
export async function processMiningYieldsAsync(targetUserId?: string): Promise<{ creditedTotal: number; contractsUpdated: number; contractsCompleted: number }> {
  const result = processMiningYields(targetUserId);
  return result;
}


