import { db, MiningContractCloudMineX, UserCloudMineX } from '../config/dbStore';
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
 * Automatically processes all 24-hour elapsed cycles for active mining contracts.
 * For each 24-hour period passed based on startDate:
 * 1. Credits daily yield (e.g. GHS 18.00) directly to user's available balance and totalRewards.
 * 2. Increments accumulatedReward on the contract.
 * 3. Records a mining_reward transaction in the ledger.
 * 4. When full duration/endDate is reached, marks contract as 'completed' (matured).
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
  const createdTransactions: any[] = [];

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

    // Days already credited so far
    const alreadyCreditedDays = Math.min(maxDays, Math.floor(((contract.accumulatedReward || 0) + 0.0001) / (dailyReward || 1)));

    // Days that must be credited now
    const targetDaysCredited = Math.min(totalDaysPassed, maxDays);
    const actualDaysToCredit = Math.max(0, targetDaysCredited - alreadyCreditedDays);

    if (actualDaysToCredit > 0) {
      const rewardToAdd = Number((actualDaysToCredit * dailyReward).toFixed(2));

      contract.accumulatedReward = Number(((contract.accumulatedReward || 0) + rewardToAdd).toFixed(2));
      contract.lastCalculatedAt = new Date(startMs + (alreadyCreditedDays + actualDaysToCredit) * ONE_DAY_MS).toISOString();
      contract.updatedAt = new Date().toISOString();

      // Credit directly to user's spendable/withdrawable balance
      user.balance = Number((user.balance + rewardToAdd).toFixed(2));
      user.totalRewards = Number(((user.totalRewards || 0) + rewardToAdd).toFixed(2));
      user.updatedAt = new Date().toISOString();

      creditedTotal += rewardToAdd;
      contractsUpdated++;
      hasDbChanges = true;
      updatedUserIds.add(user.id);
      updatedContracts.push(contract);

      // Record daily yield transactions for each credited 24h cycle
      for (let dayIndex = 1; dayIndex <= actualDaysToCredit; dayIndex++) {
        const txTime = new Date(startMs + (alreadyCreditedDays + dayIndex) * ONE_DAY_MS).toISOString();
        const newTx = {
          id: `tx_yield_${Date.now()}_${Math.floor(Math.random() * 1000)}_${dayIndex}`,
          userId: user.id,
          type: 'mining_reward' as const,
          amount: dailyReward,
          currency: user.currency || 'GHS',
          reference: `YIELD-${contract.id.slice(-4)}-${Date.now().toString().slice(-4)}`,
          description: `24h Daily Yield - ${contract.planName} (Day ${alreadyCreditedDays + dayIndex}/${maxDays})`,
          status: 'completed' as const,
          createdAt: txTime,
        };
        db.transactions.unshift(newTx);
        createdTransactions.push(newTx);
      }
    }

    // Check if contract has completed full duration or reached end date
    const isMatured = now >= endMs || (contract.accumulatedReward || 0) >= (contract.estimatedTotalReward || (dailyReward * maxDays));
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

      // Record maturity completion in ledger
      const matureTx = {
        id: `tx_mature_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        userId: user.id,
        type: 'mining_reward' as const,
        amount: 0,
        currency: user.currency || 'GHS',
        reference: `MATURE-${contract.id.slice(-4)}`,
        description: `Contract Matured: ${contract.planName} (${maxDays} Days Full Cycle Completed)`,
        status: 'completed' as const,
        createdAt: new Date().toISOString(),
      };
      db.transactions.unshift(matureTx);
      createdTransactions.push(matureTx);
    }
  }

  if (hasDbChanges) {
    db.saveData();

    // Sync updated users, contracts, and transactions to MongoDB if connected
    if (isMongoConnected()) {
      for (const uid of updatedUserIds) {
        const u = db.users.find((user) => user.id === uid);
        if (u) {
          UserModel.updateOne(
            { id: u.id },
            {
              $set: {
                balance: u.balance,
                totalRewards: u.totalRewards,
                activeContracts: u.activeContracts,
                updatedAt: u.updatedAt,
              },
            }
          ).catch((e) => console.error('[MongoDB] Mining yield user sync error:', e));
        }
      }

      for (const cntr of updatedContracts) {
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
        ).catch((e) => console.error('[MongoDB] Mining yield contract sync error:', e));
      }

      for (const tx of createdTransactions) {
        TransactionModel.create(tx).catch((e) => console.error('[MongoDB] Mining yield tx sync error:', e));
      }
    }
  }

  return { creditedTotal, contractsUpdated, contractsCompleted };
}

