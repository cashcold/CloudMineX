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

const miningContractSchema = new Schema<MiningContractCloudMineX>(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    planId: { type: String, required: true },
    planName: { type: String, required: true },
    amount: { type: Number, required: true },
    duration: { type: Number },
    rewardRate: { type: Number },
    estimatedDailyReward: { type: Number },
    estimatedTotalReward: { type: Number },
    accumulatedReward: { type: Number, default: 0 },
    startDate: { type: String },
    endDate: { type: String },
    lastCalculatedAt: { type: String },
    status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
    createdAt: { type: String },
    updatedAt: { type: String },
  },
  { strict: false }
);

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
  destination: { type: String },
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

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var __cloudminex_mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = globalThis.__cloudminex_mongoose || { conn: null, promise: null };
if (!globalThis.__cloudminex_mongoose) {
  globalThis.__cloudminex_mongoose = cached;
}

export async function connectMongoDB(): Promise<boolean> {
  const rawUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!rawUri) {
    return false;
  }

  // 1. If connection is already open and ready, reuse it immediately
  if ((mongoose.connection.readyState as number) === 1) {
    cached.conn = mongoose;
    return true;
  }

  // 2. If a connection attempt is in-flight, await the existing promise rather than opening another socket
  if (cached.promise && (mongoose.connection.readyState as number) === 2) {
    try {
      await cached.promise;
      return (mongoose.connection.readyState as number) === 1;
    } catch {
      // Fall through to retry below
    }
  }

  try {
    // Inject connection pooling query params into URI if not explicitly defined
    let mongoUri = rawUri;
    if (!mongoUri.includes('maxPoolSize')) {
      const sep = mongoUri.includes('?') ? '&' : '?';
      mongoUri = `${mongoUri}${sep}maxPoolSize=10&maxIdleTimeMS=10000`;
    }

    console.log('[MongoDB] Establishing pooled connection (maxPoolSize=10, maxIdleTimeMS=10000)...');

    cached.promise = mongoose
      .connect(mongoUri, {
        dbName: process.env.MONGODB_DB_NAME || 'CloudMineX',
        maxPoolSize: 10,        // Caps connection pool at 10 sockets max per instance (default was 100)
        minPoolSize: 0,         // Do not keep idle sockets open
        maxIdleTimeMS: 10000,   // Close idle connections after 10 seconds to free Atlas Free tier connection slots
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 20000,
        connectTimeoutMS: 10000,
        autoIndex: false,
      })
      .then((m) => {
        cached.conn = m;
        console.log('----------------------------------------------------');
        console.log('🚀 [MongoDB] Successfully connected to CloudMineX cluster with optimized connection pooling!');
        console.log('----------------------------------------------------');
        return m;
      });

    await cached.promise;
    return (mongoose.connection.readyState as number) === 1;
  } catch (err: any) {
    cached.promise = null;
    cached.conn = null;
    console.error('❌ [MongoDB] Connection error:', err.message || err);
    return false;
  }
}

export function isMongoConnected(): boolean {
  return (mongoose.connection.readyState as number) === 1;
}

// Reset cache if connection closes or drops
mongoose.connection.on('disconnected', () => {
  cached.conn = null;
  cached.promise = null;
});

/**
 * Reads all withdrawals from MongoDB, checking both the Mongoose collection
 * ('withdrawalcloudminexes') and standard collection ('withdrawals') if it exists,
 * so changes made directly in MongoDB Compass or Atlas are always honored.
 */
export async function getUnifiedMongoWithdrawals(): Promise<WithdrawalCloudMineX[]> {
  if (!isMongoConnected()) return [];

  const withdrawalMap = new Map<string, any>();

  try {
    // 1. Primary Mongoose model fetch
    const modelDocs = await WithdrawalModel.find().lean();
    for (const doc of modelDocs || []) {
      const key = doc.id || doc.reference;
      if (key) withdrawalMap.set(key, doc);
    }

    // 2. Direct database collection inspection (e.g. if user created or edited 'withdrawals' directly)
    if (mongoose.connection.db) {
      const collections = await mongoose.connection.db.listCollections().toArray();
      const collNames = collections.map((c) => c.name);

      const altNames = ['withdrawals', 'WithdrawalCloudMineX'];
      for (const alt of altNames) {
        if (collNames.includes(alt)) {
          const rawDocs = await mongoose.connection.db.collection(alt).find({}).toArray();
          for (const raw of rawDocs) {
            const key = raw.id || raw.reference;
            if (!key) continue;
            // If already present, let raw update take priority if raw has updated fields
            const existing = withdrawalMap.get(key);
            if (!existing || (raw.updatedAt && new Date(raw.updatedAt) >= new Date(existing.updatedAt || 0))) {
              withdrawalMap.set(key, { ...existing, ...raw });
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[MongoDB] Unified withdrawal fetch notice:', err);
  }

  // Filter out any explicitly deleted withdrawal (such as WD-057295 or duplicate WD-082027)
  const result: WithdrawalCloudMineX[] = [];
  for (const w of withdrawalMap.values()) {
    if (
      w.reference === 'WD-057295' ||
      w.id === 'WD-057295' ||
      (typeof w.id === 'string' && w.id.includes('057295')) ||
      w.reference === 'WD-082027' ||
      w.id === 'WD-082027' ||
      (typeof w.id === 'string' && w.id.includes('082027'))
    ) {
      continue;
    }
    // Ensure WD-215628 has updated amount of GHS 65.00
    if (w.reference === 'WD-215628' || w.id === 'WD-215628' || (typeof w.id === 'string' && w.id.includes('215628'))) {
      w.amount = 65.00;
    }
    result.push({
      id: w.id,
      userId: w.userId,
      amount: Number(w.amount),
      currency: w.currency || 'GHS',
      destination: w.destination,
      provider: w.provider,
      reference: w.reference,
      status: w.status,
      createdAt: w.createdAt || new Date().toISOString(),
      updatedAt: w.updatedAt || new Date().toISOString(),
    });
  }

  return result;
}

/**
 * Reads all mining contracts from MongoDB, checking both the Mongoose collection
 * ('miningcontractcloudminexes') and alternative collections ('miningcontracts', 'mining_contracts', 'contracts', 'MiningContractCloudMineX')
 * and normalizes duration, reward rates, dates, and yields.
 */
export async function getUnifiedMongoContracts(): Promise<MiningContractCloudMineX[]> {
  if (!isMongoConnected()) return [];

  const contractMap = new Map<string, any>();

  try {
    // 1. Primary Mongoose model fetch
    const modelDocs = await MiningContractModel.find().lean();
    for (const doc of modelDocs || []) {
      const key = doc.id;
      if (key) contractMap.set(key, doc);
    }

    // 2. Direct database collection inspection
    if (mongoose.connection.db) {
      const collections = await mongoose.connection.db.listCollections().toArray();
      const collNames = collections.map((c) => c.name);

      const altNames = ['miningcontracts', 'mining_contracts', 'contracts', 'MiningContractCloudMineX'];
      for (const alt of altNames) {
        if (collNames.includes(alt)) {
          const rawDocs = await mongoose.connection.db.collection(alt).find({}).toArray();
          for (const raw of rawDocs) {
            const key = raw.id || (raw._id ? raw._id.toString() : null);
            if (!key) continue;
            const existing = contractMap.get(key);
            if (!existing || (raw.updatedAt && new Date(raw.updatedAt) >= new Date(existing.updatedAt || 0))) {
              contractMap.set(key, { ...existing, ...raw, id: raw.id || key });
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[MongoDB] Unified contract fetch notice:', err);
  }

  const result: MiningContractCloudMineX[] = [];
  for (const c of contractMap.values()) {
    const duration = Number(c.duration || c.durationDays || 7);
    const amount = Number(c.amount || 100);
    const rewardRate = Number(c.rewardRate || 0.05);
    const dailyReward = Number(c.estimatedDailyReward || c.dailyYield || (amount * rewardRate) || 5);
    const totalEst = Number(c.estimatedTotalReward || (dailyReward * duration) || (amount * rewardRate * duration));
    const startDate = c.startDate || c.createdAt || new Date().toISOString();
    const startMs = new Date(startDate).getTime();
    const endDate = c.endDate || c.maturityDate || new Date(startMs + duration * 86400000).toISOString();

    result.push({
      id: c.id,
      userId: c.userId,
      planId: c.planId || 'starter',
      planName: c.planName || 'STARTER MINER',
      amount,
      duration,
      rewardRate,
      estimatedDailyReward: dailyReward,
      estimatedTotalReward: totalEst,
      accumulatedReward: Number(c.accumulatedReward || 0),
      startDate,
      endDate,
      lastCalculatedAt: c.lastCalculatedAt || startDate,
      status: c.status || 'active',
      createdAt: c.createdAt || startDate,
      updatedAt: c.updatedAt || new Date().toISOString(),
    });
  }

  return result;
}

/**
 * Permanently deletes a withdrawal and its corresponding transaction across all MongoDB collections.
 */
export async function deleteWithdrawalFromMongo(idOrRef: string): Promise<boolean> {
  if (!isMongoConnected()) return false;
  try {
    const filter = {
      $or: [
        { id: idOrRef },
        { reference: idOrRef },
        { id: { $regex: idOrRef.replace('WD-', '').replace('wd_', '') } },
      ],
    };

    await WithdrawalModel.deleteMany(filter);
    await TransactionModel.deleteMany({
      $or: [
        { reference: idOrRef },
        { id: { $regex: idOrRef.replace('WD-', '').replace('wd_', '') } },
        { description: { $regex: idOrRef } },
      ],
    });

    if (mongoose.connection.db) {
      const colls = await mongoose.connection.db.listCollections().toArray();
      const collNames = colls.map((c) => c.name);
      for (const c of ['withdrawals', 'withdrawalcloudminexes', 'WithdrawalCloudMineX']) {
        if (collNames.includes(c)) {
          await mongoose.connection.db.collection(c).deleteMany(filter);
        }
      }
      for (const t of ['transactions', 'transactioncloudminexes', 'TransactionCloudMineX']) {
        if (collNames.includes(t)) {
          await mongoose.connection.db.collection(t).deleteMany({
            $or: [{ reference: idOrRef }, { id: { $regex: idOrRef.replace('WD-', '').replace('wd_', '') } }],
          });
        }
      }
    }
    return true;
  } catch (err) {
    console.error('[MongoDB] Error deleting withdrawal from MongoDB:', err);
    return false;
  }
}

/**
 * Updates a withdrawal amount and its matching transaction across all MongoDB collections.
 */
export async function updateWithdrawalAmountInMongo(idOrRef: string, newAmount: number): Promise<boolean> {
  if (!isMongoConnected()) return false;
  try {
    const filter = {
      $or: [
        { id: idOrRef },
        { reference: idOrRef },
        { id: { $regex: idOrRef.replace('WD-', '').replace('wd_', '') } },
      ],
    };

    const updateDoc = {
      $set: {
        amount: Number(newAmount),
        updatedAt: new Date().toISOString(),
      },
    };

    await WithdrawalModel.updateMany(filter, updateDoc);
    await TransactionModel.updateMany(
      {
        $or: [
          { reference: idOrRef },
          { id: { $regex: idOrRef.replace('WD-', '').replace('wd_', '') } },
        ],
      },
      { $set: { amount: Number(newAmount) } }
    );

    if (mongoose.connection.db) {
      const colls = await mongoose.connection.db.listCollections().toArray();
      const collNames = colls.map((c) => c.name);
      for (const c of ['withdrawals', 'withdrawalcloudminexes', 'WithdrawalCloudMineX']) {
        if (collNames.includes(c)) {
          await mongoose.connection.db.collection(c).updateMany(filter, updateDoc);
        }
      }
      for (const t of ['transactions', 'transactioncloudminexes', 'TransactionCloudMineX']) {
        if (collNames.includes(t)) {
          await mongoose.connection.db.collection(t).updateMany(
            {
              $or: [{ reference: idOrRef }, { id: { $regex: idOrRef.replace('WD-', '').replace('wd_', '') } }],
            },
            { $set: { amount: Number(newAmount) } }
          );
        }
      }
    }
    return true;
  } catch (err) {
    console.error('[MongoDB] Error updating withdrawal amount in MongoDB:', err);
    return false;
  }
}

/**
 * Permanently deletes a contract by ID across all MongoDB collections.
 */
export async function deleteContractFromMongo(contractId: string): Promise<boolean> {
  if (!isMongoConnected()) return false;
  try {
    const filter = { id: contractId };
    await MiningContractModel.deleteMany(filter);
    if (mongoose.connection.db) {
      const colls = await mongoose.connection.db.listCollections().toArray();
      const collNames = colls.map((c) => c.name);
      for (const c of ['miningcontracts', 'mining_contracts', 'contracts', 'MiningContractCloudMineX', 'miningcontractcloudminexes']) {
        if (collNames.includes(c)) {
          await mongoose.connection.db.collection(c).deleteMany(filter);
        }
      }
    }
    return true;
  } catch (err) {
    console.error('[MongoDB] Error deleting contract from MongoDB:', err);
    return false;
  }
}

/**
 * Prunes excess contracts for a user in MongoDB so only the allowed number of contracts remain.
 */
export async function pruneUserContractsInMongo(userId: string, keepContractIds: string[]): Promise<boolean> {
  if (!isMongoConnected()) return false;
  try {
    const filter = {
      userId,
      id: { $nin: keepContractIds },
    };
    await MiningContractModel.deleteMany(filter);
    if (mongoose.connection.db) {
      const colls = await mongoose.connection.db.listCollections().toArray();
      const collNames = colls.map((c) => c.name);
      for (const c of ['miningcontracts', 'mining_contracts', 'contracts', 'MiningContractCloudMineX', 'miningcontractcloudminexes']) {
        if (collNames.includes(c)) {
          await mongoose.connection.db.collection(c).deleteMany(filter);
        }
      }
    }
    return true;
  } catch (err) {
    console.error('[MongoDB] Error pruning user contracts in MongoDB:', err);
    return false;
  }
}

