import { MiningContractCloudMineX } from '../config/dbStore';

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

export function processContractTick(contract: MiningContractCloudMineX): { newReward: number; isCompleted: boolean } {
  if (contract.status !== 'active') {
    return { newReward: 0, isCompleted: contract.status === 'completed' };
  }

  const now = new Date();
  const startDate = new Date(contract.startDate);
  const endDate = new Date(contract.endDate);

  if (now >= endDate) {
    return { newReward: 0, isCompleted: true };
  }

  // Calculate daily incremental reward tick
  const dailyReward = contract.estimatedDailyReward;
  return { newReward: dailyReward, isCompleted: false };
}
