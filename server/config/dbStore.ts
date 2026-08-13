import fs from 'fs';
import path from 'path';

export interface UserCloudMineX {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  paymentMethod?: string;
  paymentAddress?: string;
  balance: number;
  totalDeposits?: number;
  currency: string;
  referralCode: string;
  referredBy?: string | null;
  vipLevel?: number;
  vipTier?: string;
  totalRewards: number;
  activeContracts: number;
  createdAt: string;
  updatedAt: string;
}

export interface MiningPlanCloudMineX {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in days
  rewardRate: number; // percentage or daily multiplier e.g., 0.05 (5%)
  estimatedDailyReward: number;
  estimatedTotalReward: number;
  image: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MiningContractCloudMineX {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  amount: number;
  duration: number;
  rewardRate: number;
  estimatedDailyReward: number;
  estimatedTotalReward: number;
  accumulatedReward: number;
  startDate: string;
  endDate: string;
  lastCalculatedAt: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface DepositCloudMineX {
  id: string;
  userId: string;
  type: 'mobile_money' | 'crypto';
  provider: string; // e.g. MTN MoMo, Telecel Cash, AT Money, BTC, ETH, USDT
  currency: string; // GHS, BTC, ETH, USDT
  network?: string; // ERC-20, TRC-20, BEP-20, Bitcoin, Ethereum Mainnet
  amount: number; // GHS value
  cryptoAmount?: number;
  address?: string;
  reference: string;
  transactionHash?: string;
  confirmations?: number;
  requiredConfirmations?: number;
  status: 'pending' | 'detected' | 'confirming' | 'confirmed' | 'failed' | 'expired' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface WithdrawalCloudMineX {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  destination: string;
  provider: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'demo-pending';
  reference: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionCloudMineX {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'mining_reward' | 'referral_reward' | 'mining_purchase';
  amount: number;
  currency: string;
  reference: string;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  metadata?: any;
  createdAt: string;
}

export interface ReferralCloudMineX {
  id: string;
  referrerId: string;
  referredUserId: string;
  referredUsername: string;
  referralCode?: string;
  reward: number;
  status: 'active' | 'completed' | 'pending' | 'funded';
  createdAt: string;
}

export interface ChatMessageCloudMineX {
  id: string;
  username: string;
  text: string;
  badge?: string;
  type?: 'payout' | 'deposit' | 'chat';
  createdAt: string;
}

export interface AppSettingsCloudMineX {
  demoMode: boolean;
  baseCurrency: string;
  btcAddress: string;
  ethAddress: string;
  usdtErc20Address: string;
  usdtTrc20Address: string;
  usdtBep20Address: string;
  confirmationsBtc: number;
  confirmationsEth: number;
  confirmationsUsdt: number;
  mtnMerchantName: string;
  mtnMerchantNumber: string;
  telecelMerchantName: string;
  telecelMerchantNumber: string;
  atMerchantName: string;
  atMerchantNumber: string;
  vodafoneMerchantName?: string;
  vodafoneMerchantNumber?: string;
  vodafoneAccountName?: string;
  vodafoneWalletType?: string;
  referralBonusPercent: number;
}

// Aliases for compatibility
export type User = UserCloudMineX;
export type MiningPlan = MiningPlanCloudMineX;
export type MiningContract = MiningContractCloudMineX;
export type Deposit = DepositCloudMineX;
export type Withdrawal = WithdrawalCloudMineX;
export type Transaction = TransactionCloudMineX;
export type Referral = ReferralCloudMineX;
export type ChatMessage = ChatMessageCloudMineX;
export type AppSettings = AppSettingsCloudMineX;

const DATA_FILE = path.join(process.cwd(), 'cloudminex_data.json');

class DBStore {
  public users: UserCloudMineX[] = [];
  public miningPlans: MiningPlanCloudMineX[] = [];
  public miningContracts: MiningContractCloudMineX[] = [];
  public deposits: DepositCloudMineX[] = [];
  public withdrawals: WithdrawalCloudMineX[] = [];
  public transactions: TransactionCloudMineX[] = [];
  public referrals: ReferralCloudMineX[] = [];
  public chatMessages: ChatMessageCloudMineX[] = [];
  public settings: AppSettingsCloudMineX = {
    demoMode: true,
    baseCurrency: 'GHS',
    btcAddress: process.env.BTC_DEPOSIT_ADDRESS || 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    ethAddress: process.env.ETH_DEPOSIT_ADDRESS || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    usdtErc20Address: process.env.USDT_ERC20_ADDRESS || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    usdtTrc20Address: process.env.USDT_TRC20_ADDRESS || 'TX9Z2s213xS9281a8c9831920zmsa',
    usdtBep20Address: process.env.USDT_BEP20_ADDRESS || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    confirmationsBtc: Number(process.env.REQUIRED_CONFIRMATIONS_BTC) || 3,
    confirmationsEth: Number(process.env.REQUIRED_CONFIRMATIONS_ETH) || 12,
    confirmationsUsdt: Number(process.env.REQUIRED_CONFIRMATIONS_USDT) || 12,
    mtnMerchantName: 'CloudMineX Ghana MoMo',
    mtnMerchantNumber: '+233 24 123 4567',
    telecelMerchantName: 'CloudMineX Telecel Cash',
    telecelMerchantNumber: '+233 20 987 6543',
    atMerchantName: 'CloudMineX AT Money',
    atMerchantNumber: '+233 27 555 0192',
    vodafoneMerchantName: 'Vodafone Cash',
    vodafoneMerchantNumber: '0202496815',
    vodafoneAccountName: 'Charles Asumah',
    vodafoneWalletType: 'Vodafone Cash',
    referralBonusPercent: 7,
  };

  constructor() {
    this.loadData();
  }

  private loadData() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        this.users = parsed.users || [];
        this.miningPlans = parsed.miningPlans || [];
        this.miningContracts = parsed.miningContracts || [];
        this.deposits = parsed.deposits || [];
        this.withdrawals = parsed.withdrawals || [];
        this.transactions = parsed.transactions || [];
        this.referrals = parsed.referrals || [];
        this.chatMessages = parsed.chatMessages || [];
        if (parsed.settings) {
          this.settings = { ...this.settings, ...parsed.settings };
        }
        this.ensureDefaultPlans();
      } else {
        this.seedInitialData();
      }
    } catch (err) {
      console.error('Error reading cloudminex_data.json, seeding defaults:', err);
      this.seedInitialData();
    }
  }

  public ensureDefaultPlans() {
    const now = new Date().toISOString();
    const defaultPlans: MiningPlanCloudMineX[] = [
      {
        id: 'plan_starter',
        name: 'STARTER MINER',
        description: 'Entry level cloud rig for new digital miners.',
        price: 100,
        duration: 7,
        rewardRate: 0.05,
        estimatedDailyReward: 5.00,
        estimatedTotalReward: 35.00,
        image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=400&q=80',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'plan_basic',
        name: 'BASIC MINER',
        description: 'Reliable dual-chip miner with enhanced daily yield.',
        price: 300,
        duration: 14,
        rewardRate: 0.06,
        estimatedDailyReward: 18.00,
        estimatedTotalReward: 252.00,
        image: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1bd?auto=format&fit=crop&w=400&q=80',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'plan_pro',
        name: 'PRO MINER',
        description: 'High-performance cloud mining rig with steady 30-day payout.',
        price: 700,
        duration: 30,
        rewardRate: 0.07,
        estimatedDailyReward: 49.00,
        estimatedTotalReward: 1470.00,
        image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'plan_advanced',
        name: 'ADVANCED MINER',
        description: 'Industrial grade GPU array miner for maximum yield potential.',
        price: 1500,
        duration: 60,
        rewardRate: 0.08,
        estimatedDailyReward: 120.00,
        estimatedTotalReward: 7200.00,
        image: 'https://images.unsplash.com/photo-1605792657660-596af9009e82?auto=format&fit=crop&w=400&q=80',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'plan_premium',
        name: 'PREMIUM MINER',
        description: 'Flagship enterprise ASIC cluster for long-term rewards.',
        price: 3000,
        duration: 90,
        rewardRate: 0.09,
        estimatedDailyReward: 270.00,
        estimatedTotalReward: 24300.00,
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'plan_vip',
        name: 'VIP MINER',
        description: 'VIP multi-hash node dedicated to high-frequency block rewards.',
        price: 5000,
        duration: 90,
        rewardRate: 0.10,
        estimatedDailyReward: 500.00,
        estimatedTotalReward: 45000.00,
        image: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=400&q=80',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'plan_enterprise',
        name: 'ENTERPRISE MINER',
        description: 'Enterprise datacenter rack with priority network bandwidth and 11% daily ROI.',
        price: 10000,
        duration: 120,
        rewardRate: 0.11,
        estimatedDailyReward: 1100.00,
        estimatedTotalReward: 132000.00,
        image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'plan_titan',
        name: 'TITAN RIG MINER',
        description: 'Ultra-high density 20,000 GHC industrial mining rig with 12% daily compound yield.',
        price: 20000,
        duration: 180,
        rewardRate: 0.12,
        estimatedDailyReward: 2400.00,
        estimatedTotalReward: 432000.00,
        image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=400&q=80',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
    ];

    let modified = false;
    for (const def of defaultPlans) {
      const idx = this.miningPlans.findIndex((p) => p.id === def.id);
      if (idx === -1) {
        this.miningPlans.push(def);
        modified = true;
      } else {
        // Ensure price, rates and rewards match latest spec
        const current = this.miningPlans[idx];
        if (
          current.price !== def.price ||
          current.duration !== def.duration ||
          current.rewardRate !== def.rewardRate ||
          current.estimatedDailyReward !== def.estimatedDailyReward
        ) {
          this.miningPlans[idx] = { ...current, ...def };
          modified = true;
        }
      }
    }

    if (modified) {
      this.saveData();
    }
  }

  public saveData() {
    try {
      const data = {
        users: this.users,
        miningPlans: this.miningPlans,
        miningContracts: this.miningContracts,
        deposits: this.deposits,
        withdrawals: this.withdrawals,
        transactions: this.transactions,
        referrals: this.referrals,
        chatMessages: this.chatMessages,
        settings: this.settings,
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');

      // Async sync to MongoDB if connected
      this.syncToMongo().catch((err) => {
        // Silent catch for background mongo sync
      });
    } catch (err) {
      console.error('Error saving cloudminex_data.json:', err);
    }
  }

  public async syncToMongo() {
    try {
      const {
        isMongoConnected,
        UserModel,
        MiningPlanModel,
        MiningContractModel,
        DepositModel,
        WithdrawalModel,
        TransactionModel,
        ReferralModel,
        ChatMessageModel,
        AppSettingsModel,
      } = await import('./dbMongo');

      if (!isMongoConnected()) return;

      // Upsert users
      for (const u of this.users) {
        await UserModel.updateOne({ id: u.id }, u, { upsert: true });
      }

      // Upsert plans
      for (const p of this.miningPlans) {
        await MiningPlanModel.updateOne({ id: p.id }, p, { upsert: true });
      }

      // Upsert contracts
      for (const c of this.miningContracts) {
        await MiningContractModel.updateOne({ id: c.id }, c, { upsert: true });
      }

      // Upsert deposits
      for (const d of this.deposits) {
        await DepositModel.updateOne({ id: d.id }, d, { upsert: true });
      }

      // Upsert withdrawals
      for (const w of this.withdrawals) {
        await WithdrawalModel.updateOne({ id: w.id }, w, { upsert: true });
      }

      // Upsert transactions
      for (const t of this.transactions) {
        await TransactionModel.updateOne({ id: t.id }, t, { upsert: true });
      }

      // Upsert referrals
      for (const r of this.referrals) {
        await ReferralModel.updateOne({ id: r.id }, r, { upsert: true });
      }

      // Upsert chat messages
      for (const cm of this.chatMessages) {
        await ChatMessageModel.updateOne({ id: cm.id }, cm, { upsert: true });
      }

      // Upsert settings
      await AppSettingsModel.updateOne({}, this.settings, { upsert: true });
    } catch (err) {
      console.error('[MongoDB] Sync error:', err);
    }
  }

  public async syncFromMongo() {
    try {
      const {
        isMongoConnected,
        UserModel,
        MiningPlanModel,
        MiningContractModel,
        DepositModel,
        WithdrawalModel,
        TransactionModel,
        ReferralModel,
        ChatMessageModel,
        AppSettingsModel,
      } = await import('./dbMongo');

      if (!isMongoConnected()) return;

      const mongoUsers = await UserModel.find().lean();
      if (mongoUsers && mongoUsers.length > 0) {
        this.users = mongoUsers.map((u: any) => ({
          id: u.id,
          username: u.username,
          email: u.email,
          phone: u.phone,
          paymentMethod: u.paymentMethod,
          paymentAddress: u.paymentAddress,
          balance: u.balance || 0,
          totalDeposits: u.totalDeposits || 0,
          currency: u.currency || 'GHS',
          referralCode: u.referralCode || u.refCode || 'CMX-' + Math.floor(Math.random() * 8999 + 1000),
          referredBy: u.referredBy || null,
          vipLevel: u.vipLevel,
          vipTier: u.vipTier,
          totalRewards: u.totalRewards || 0,
          activeContracts: u.activeContracts || 0,
          createdAt: u.createdAt || new Date().toISOString(),
          updatedAt: u.updatedAt || new Date().toISOString(),
        }));
      }

      const mongoPlans = await MiningPlanModel.find().lean();
      if (mongoPlans && mongoPlans.length > 0) {
        this.miningPlans = mongoPlans.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          price: p.price,
          duration: p.duration,
          rewardRate: p.rewardRate,
          estimatedDailyReward: p.estimatedDailyReward,
          estimatedTotalReward: p.estimatedTotalReward,
          image: p.image || 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1bd?auto=format&fit=crop&w=600&q=80',
          active: p.active !== undefined ? p.active : true,
          createdAt: p.createdAt || new Date().toISOString(),
          updatedAt: p.updatedAt || new Date().toISOString(),
        }));
      }
      this.ensureDefaultPlans();

      const mongoDeposits = await DepositModel.find().lean();
      if (mongoDeposits && mongoDeposits.length > 0) {
        this.deposits = mongoDeposits.map((d: any) => ({
          id: d.id,
          userId: d.userId,
          type: d.type,
          provider: d.provider,
          currency: d.currency,
          network: d.network,
          amount: d.amount,
          cryptoAmount: d.cryptoAmount,
          address: d.address,
          reference: d.reference,
          transactionHash: d.transactionHash,
          status: d.status,
          confirmations: d.confirmations,
          requiredConfirmations: d.requiredConfirmations,
          createdAt: d.createdAt || new Date().toISOString(),
          updatedAt: d.updatedAt || new Date().toISOString(),
        }));
      }

      const mongoWithdrawals = await WithdrawalModel.find().lean();
      if (mongoWithdrawals && mongoWithdrawals.length > 0) {
        this.withdrawals = mongoWithdrawals.map((w: any) => ({
          id: w.id,
          userId: w.userId,
          amount: w.amount,
          currency: w.currency || 'GHS',
          destination: w.destination,
          provider: w.provider,
          reference: w.reference,
          status: w.status,
          createdAt: w.createdAt || new Date().toISOString(),
          updatedAt: w.updatedAt || new Date().toISOString(),
        }));
      }

      const mongoTx = await TransactionModel.find().lean();
      if (mongoTx && mongoTx.length > 0) {
        this.transactions = mongoTx.map((t: any) => ({
          id: t.id,
          userId: t.userId,
          type: t.type,
          amount: t.amount,
          currency: t.currency || 'GHS',
          reference: t.reference || '',
          description: t.description || '',
          status: t.status || 'completed',
          metadata: t.metadata,
          createdAt: t.createdAt || new Date().toISOString(),
        }));
      }

      console.log('[MongoDB] Synced all records from MongoDB database into active memory!');
    } catch (err) {
      console.error('[MongoDB] Fetch error:', err);
    }
  }

  public seedInitialData() {
    const now = new Date().toISOString();

    // Seed Demo User
    const demoUser: UserCloudMineX = {
      id: 'usr_demo_101',
      username: 'demoUser',
      balance: 1000.00,
      currency: 'GHS',
      referralCode: 'CMX-7892',
      totalRewards: 125.50,
      activeContracts: 1,
      createdAt: now,
      updatedAt: now,
    };
    this.users = [demoUser];

    // Seed Mining Plans according to spec
    this.miningPlans = [
      {
        id: 'plan_starter',
        name: 'STARTER MINER',
        description: 'Entry level cloud rig for new digital miners.',
        price: 100,
        duration: 7,
        rewardRate: 0.05, // 5% daily
        estimatedDailyReward: 5.00,
        estimatedTotalReward: 35.00,
        image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=400&q=80',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'plan_basic',
        name: 'BASIC MINER',
        description: 'Reliable dual-chip miner with enhanced daily yield.',
        price: 300,
        duration: 14,
        rewardRate: 0.06, // 6% daily
        estimatedDailyReward: 18.00,
        estimatedTotalReward: 252.00,
        image: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1bd?auto=format&fit=crop&w=400&q=80',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'plan_pro',
        name: 'PRO MINER',
        description: 'High-performance cloud mining rig with steady 30-day payout.',
        price: 700,
        duration: 30,
        rewardRate: 0.07, // 7% daily
        estimatedDailyReward: 49.00,
        estimatedTotalReward: 1470.00,
        image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'plan_advanced',
        name: 'ADVANCED MINER',
        description: 'Industrial grade GPU array miner for maximum yield potential.',
        price: 1500,
        duration: 60,
        rewardRate: 0.08, // 8% daily
        estimatedDailyReward: 120.00,
        estimatedTotalReward: 7200.00,
        image: 'https://images.unsplash.com/photo-1605792657660-596af9009e82?auto=format&fit=crop&w=400&q=80',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'plan_premium',
        name: 'PREMIUM MINER',
        description: 'Flagship enterprise ASIC cluster for long-term rewards.',
        price: 3000,
        duration: 90,
        rewardRate: 0.09, // 9% daily
        estimatedDailyReward: 270.00,
        estimatedTotalReward: 24300.00,
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'plan_vip',
        name: 'VIP MINER',
        description: 'VIP multi-hash node dedicated to high-frequency block rewards.',
        price: 5000,
        duration: 90,
        rewardRate: 0.10, // 10% daily
        estimatedDailyReward: 500.00,
        estimatedTotalReward: 45000.00,
        image: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=400&q=80',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'plan_enterprise',
        name: 'ENTERPRISE MINER',
        description: 'Enterprise datacenter rack with priority network bandwidth and 11% daily ROI.',
        price: 10000,
        duration: 120,
        rewardRate: 0.11, // 11% daily
        estimatedDailyReward: 1100.00,
        estimatedTotalReward: 132000.00,
        image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'plan_titan',
        name: 'TITAN RIG MINER',
        description: 'Ultra-high density 20,000 GHC industrial mining rig with 12% daily compound yield.',
        price: 20000,
        duration: 180,
        rewardRate: 0.12, // 12% daily
        estimatedDailyReward: 2400.00,
        estimatedTotalReward: 432000.00,
        image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=400&q=80',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
    ];

    // Seed 1 active mining contract for demoUser
    const starterPlan = this.miningPlans[0];
    const startDate = new Date(Date.now() - 2 * 86400000).toISOString(); // started 2 days ago
    const endDate = new Date(Date.now() + 5 * 86400000).toISOString();
    this.miningContracts = [
      {
        id: 'cntr_demo_001',
        userId: 'usr_demo_101',
        planId: starterPlan.id,
        planName: starterPlan.name,
        amount: starterPlan.price,
        duration: starterPlan.duration,
        rewardRate: starterPlan.rewardRate,
        estimatedDailyReward: starterPlan.estimatedDailyReward,
        estimatedTotalReward: starterPlan.estimatedTotalReward,
        accumulatedReward: 10.00, // 2 days of rewards
        startDate,
        endDate,
        lastCalculatedAt: startDate,
        status: 'active',
        createdAt: startDate,
        updatedAt: startDate,
      },
    ];

    // Seed initial transaction history
    this.transactions = [
      {
        id: 'tx_seed_001',
        userId: 'usr_demo_101',
        type: 'deposit',
        amount: 1000.00,
        currency: 'GHS',
        reference: 'DEP-MOMO-9182',
        description: 'Mobile Money Welcome Demo Credit',
        status: 'completed',
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
      {
        id: 'tx_seed_002',
        userId: 'usr_demo_101',
        type: 'mining_purchase',
        amount: 100.00,
        currency: 'GHS',
        reference: 'PURCHASE-STARTER-01',
        description: 'Starter Miner Contract Activation',
        status: 'completed',
        createdAt: startDate,
      },
      {
        id: 'tx_seed_003',
        userId: 'usr_demo_101',
        type: 'mining_reward',
        amount: 5.00,
        currency: 'GHS',
        reference: 'REWARD-DAY-1',
        description: 'Simulated Mining Reward - Starter Miner',
        status: 'completed',
        createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
    ];

    // Seed referrals
    this.referrals = [
      {
        id: 'ref_001',
        referrerId: 'usr_demo_101',
        referredUserId: 'usr_ref_201',
        referredUsername: 'Kwame_Miner',
        referralCode: 'CMX-7892',
        reward: 15.00,
        status: 'completed',
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: 'ref_002',
        referrerId: 'usr_demo_101',
        referredUserId: 'usr_ref_202',
        referredUsername: 'Akosua_Crypto',
        referralCode: 'CMX-7892',
        reward: 35.00,
        status: 'completed',
        createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
    ];

    // Seed Community Chat Claims (Clean usernames without underscores)
    this.chatMessages = [
      {
        id: 'chat_001',
        username: 'Kwame',
        text: 'Just received GHS 350.00 directly to my MTN MoMo! CloudMineX pays fast 🔥',
        badge: 'Verified Payout',
        type: 'payout',
        createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
      },
      {
        id: 'chat_002',
        username: 'Abena',
        text: 'Deposited GHS 300 via Telecel Cash and activated Basic Miner rig! Daily yield GHS 18.00 received today 🚀',
        badge: 'Active Miner',
        type: 'deposit',
        createdAt: new Date(Date.now() - 22 * 60000).toISOString(),
      },
      {
        id: 'chat_003',
        username: 'Kofi',
        text: 'Welcome bonus GHS 50 activated after my first deposit! Best cloud mining platform in Ghana',
        badge: 'VIP Member',
        type: 'chat',
        createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
      },
      {
        id: 'chat_004',
        username: 'Rita',
        text: 'Withdrawal of GHS 700.00 confirmed in 3 minutes! Thanks CloudMineX admin!',
        badge: 'Verified Payout',
        type: 'payout',
        createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
      },
      {
        id: 'chat_005',
        username: 'Yaw',
        text: 'Started Pro Miner plan GHS 700! Estimated daily GHS 49.00 incoming everyday',
        badge: 'Pro Miner',
        type: 'deposit',
        createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
      },
      {
        id: 'chat_006',
        username: 'Belinda',
        text: 'GHS 450 payout received on my MoMo account! Thanks CloudMineX team 🙏',
        badge: 'Verified Payout',
        type: 'payout',
        createdAt: new Date(Date.now() - 1 * 60000).toISOString(),
      },
      {
        id: 'chat_007',
        username: 'Bob',
        text: 'My GHS 50 welcome bonus plus daily earnings cashed out right after my first GHS 100 recharge!',
        badge: 'Active Miner',
        type: 'payout',
        createdAt: new Date(Date.now() - 30 * 1000).toISOString(),
      },
    ];

    this.saveData();
  }
}

export const db = new DBStore();
