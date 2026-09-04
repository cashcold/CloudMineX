import mongoose, { Schema } from 'mongoose';
import {
  UserCloudMineX,
  MiningPlanCloudMineX,
  MiningContractCloudMineX,
  DepositCloudMineX,
  WithdrawalCloudMineX,
  TransactionCloudMineX,
  ReferralCloudMineX,
  ChatMessageCloudMineX,
  AppSettingsCloudMineX,
} from './dbStore';

// Mongoose Schemas
const userSchema = new Schema<UserCloudMineX>({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  password: { type: String },
  paymentMethod: { type: String },
  paymentAddress: { type: String },
  balance: { type: Number, default: 0 },
  totalDeposits: { type: Number, default: 0 },
  currency: { type: String, default: 'GHS' },
  referralCode: { type: String, default: '' },
  referredBy: { type: String },
  vipLevel: { type: Number },
  vipTier: { type: String },
  claimedMilestones: { type: [String], default: [] },
  totalRewards: { type: Number, default: 0 },
  activeContracts: { type: Number, default: 0 },
  createdAt: { type: String },
  updatedAt: { type: String },
});

const miningPlanSchema = new Schema<MiningPlanCloudMineX>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  duration: { type: Number, required: true },
  rewardRate: { type: Number, required: true },
  estimatedDailyReward: { type: Number, required: true },
  estimatedTotalReward: { type: Number, required: true },
  image: { type: String, default: '' },
  active: { type: Boolean, default: true },
  createdAt: { type: String },
  updatedAt: { type: String },
});

const miningContractSchema = new Schema<MiningContractCloudMineX>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  planId: { type: String, required: true },
  planName: { type: String, required: true },
  amount: { type: Number, required: true },
  duration: { type: Number, required: true },
  rewardRate: { type: Number, required: true },
  estimatedDailyReward: { type: Number, required: true },
  estimatedTotalReward: { type: Number, required: true },
  accumulatedReward: { type: Number, default: 0 },
  startDate: { type: String },
  endDate: { type: String },
  lastCalculatedAt: { type: String },
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
  createdAt: { type: String },
  updatedAt: { type: String },
});

const depositSchema = new Schema<DepositCloudMineX>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  type: { type: String, required: true },
  provider: { type: String, required: true },
  currency: { type: String, required: true },
  network: { type: String },
  amount: { type: Number, required: true },
  cryptoAmount: { type: Number },
  address: { type: String },
  reference: { type: String, required: true },
  transactionHash: { type: String },
  status: { type: String, default: 'pending' },
  confirmations: { type: Number, default: 0 },
  requiredConfirmations: { type: Number, default: 3 },
  createdAt: { type: String },
  updatedAt: { type: String },
});

const withdrawalSchema = new Schema<WithdrawalCloudMineX>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'GHS' },
  destination: { type: String, required: true },
  provider: { type: String, required: true },
  reference: { type: String, required: true },
  status: { type: String, default: 'pending' },
  createdAt: { type: String },
  updatedAt: { type: String },
});

const transactionSchema = new Schema<TransactionCloudMineX>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  type: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'GHS' },
  reference: { type: String },
  description: { type: String },
  status: { type: String, default: 'completed' },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: String },
});

const referralSchema = new Schema<ReferralCloudMineX>({
  id: { type: String, required: true, unique: true },
  referrerId: { type: String, required: true },
  referredUserId: { type: String, required: true },
  referredUsername: { type: String, required: true },
  referralCode: { type: String },
  reward: { type: Number, default: 0 },
  status: { type: String, default: 'pending' },
  createdAt: { type: String },
});

const chatMessageSchema = new Schema<ChatMessageCloudMineX>({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  text: { type: String, required: true },
  badge: { type: String },
  type: { type: String },
  createdAt: { type: String },
});

const appSettingsSchema = new Schema<AppSettingsCloudMineX>({
  demoMode: { type: Boolean, default: true },
  baseCurrency: { type: String, default: 'GHS' },
  btcAddress: { type: String },
  ethAddress: { type: String },
  usdtErc20Address: { type: String },
  usdtTrc20Address: { type: String },
  usdtBep20Address: { type: String },
  confirmationsBtc: { type: Number, default: 3 },
  confirmationsEth: { type: Number, default: 12 },
  confirmationsUsdt: { type: Number, default: 10 },
  mtnMerchantName: { type: String },
  mtnMerchantNumber: { type: String },
  telecelMerchantName: { type: String },
  telecelMerchantNumber: { type: String },
  atMerchantName: { type: String },
  atMerchantNumber: { type: String },
  vodafoneMerchantName: { type: String },
  vodafoneMerchantNumber: { type: String },
  vodafoneAccountName: { type: String },
  vodafoneWalletType: { type: String },
  referralBonusPercent: { type: Number, default: 7 },
});

export const UserModel = mongoose.models.UserCloudMineX || mongoose.model<UserCloudMineX>('UserCloudMineX', userSchema);
export const MiningPlanModel = mongoose.models.MiningPlanCloudMineX || mongoose.model<MiningPlanCloudMineX>('MiningPlanCloudMineX', miningPlanSchema);
export const MiningContractModel = mongoose.models.MiningContractCloudMineX || mongoose.model<MiningContractCloudMineX>('MiningContractCloudMineX', miningContractSchema);
export const DepositModel = mongoose.models.DepositCloudMineX || mongoose.model<DepositCloudMineX>('DepositCloudMineX', depositSchema);
export const WithdrawalModel = mongoose.models.WithdrawalCloudMineX || mongoose.model<WithdrawalCloudMineX>('WithdrawalCloudMineX', withdrawalSchema);
export const TransactionModel = mongoose.models.TransactionCloudMineX || mongoose.model<TransactionCloudMineX>('TransactionCloudMineX', transactionSchema);
export const ReferralModel = mongoose.models.ReferralCloudMineX || mongoose.model<ReferralCloudMineX>('ReferralCloudMineX', referralSchema);
export const ChatMessageModel = mongoose.models.ChatMessageCloudMineX || mongoose.model<ChatMessageCloudMineX>('ChatMessageCloudMineX', chatMessageSchema);
export const AppSettingsModel = mongoose.models.AppSettingsCloudMineX || mongoose.model<AppSettingsCloudMineX>('AppSettingsCloudMineX', appSettingsSchema);

let isConnected = false;

export async function connectMongoDB(): Promise<boolean> {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.log('[MongoDB] MONGODB_URI/MONGO_URI environment variable is not set. Operating with local persistent store.');
    return false;
  }

  if (isConnected && mongoose.connection.readyState === 1) return true;

  try {
    console.log('[MongoDB] Attempting to connect to MongoDB cluster (Database: CloudMineX)...');
    await mongoose.connect(mongoUri, {
      dbName: process.env.MONGODB_DB_NAME || 'CloudMineX',
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log('----------------------------------------------------');
    console.log('🚀 [MongoDB] Successfully connected to CloudMineX MongoDB database!');
    console.log('----------------------------------------------------');
    return true;
  } catch (err: any) {
    console.error('❌ [MongoDB] Connection error:', err.message || err);
    return false;
  }
}

export function isMongoConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}
