import fs from 'fs';
import path from 'path';

export interface UserCloudMineX {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  password?: string;
  paymentMethod?: string;
  paymentAddress?: string;
  balance: number;
  totalDeposits?: number;
  currency: string;
  referralCode: string;
  referredBy?: string | null;
  vipLevel?: number;
  vipTier?: string;
  claimedMilestones?: string[];
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
  destination?: string;
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
  telegramBotToken?: string;
  telegramAdminChatId?: string;
  telegramNotificationsEnabled?: boolean;
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
const TMP_DATA_FILE = path.join('/tmp', 'cloudminex_data.json');

class DBStore {
  public users: UserCloudMineX[] = [];
  public miningPlans: MiningPlanCloudMineX[] = [];
  public miningContracts: MiningContractCloudMineX[] = [];
  public deposits: DepositCloudMineX[] = [];
  public withdrawals: WithdrawalCloudMineX[] = [];
  public transactions: TransactionCloudMineX[] = [];
  public referrals: ReferralCloudMineX[] = [];
  public chatMessages: ChatMessageCloudMineX[] = [];
  public passwordResetOtps: Array<{ emailOrUsername: string; code: string; expiresAt: number }> = [];
  public settings: AppSettingsCloudMineX = {
    demoMode: true,
    baseCurrency: 'GHS',
    btcAddress: process.env.BTC_DEPOSIT_ADDRESS || '15512yaegwoVpZ2mjnsZ8mmVdhMnbcYybZ',
    ethAddress: process.env.ETH_DEPOSIT_ADDRESS || '0x450306b9721d2cc03a70f3c6aa9b7a61b0137b44',
    usdtErc20Address: process.env.USDT_ERC20_ADDRESS || '0x450306b9721d2cc03a70f3c6aa9b7a61b0137b44',
    usdtTrc20Address: process.env.USDT_TRC20_ADDRESS || 'TMmpdCUFH9xJ5efivRdyAw8MBVGqdsJmpX',
    usdtBep20Address: process.env.USDT_BEP20_ADDRESS || '0x450306b9721d2cc03a70f3c6aa9b7a61b0137b44',
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
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '8755123580:AAHFP1Zr-YUivo1Mm9iy-wavlXambFTM0rY',
    telegramAdminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID || '6336803190',
    telegramNotificationsEnabled: true,
  };

  constructor() {
    this.loadData();
  }

  private loadData() {
    // If MongoDB URI is configured, MongoDB is the authoritative database.
    // Do not load local memory or disk files.
    if (process.env.MONGODB_URI || process.env.MONGO_URI) {
      this.users = [];
      this.miningContracts = [];
      this.deposits = [];
      this.withdrawals = [];
      this.transactions = [];
      this.referrals = [];
      this.chatMessages = [];
      this.ensureDefaultPlans();
      return;
    }

    try {
      let fileToRead = DATA_FILE;
      // In serverless environments (e.g. Vercel), check if latest data was written to /tmp
      if (process.env.VERCEL && fs.existsSync(TMP_DATA_FILE)) {
        fileToRead = TMP_DATA_FILE;
      }

      if (fs.existsSync(fileToRead)) {
        const fileContent = fs.readFileSync(fileToRead, 'utf-8');
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
          this.settings = {
            ...this.settings,
            ...parsed.settings,
            telegramBotToken: parsed.settings.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || '8755123580:AAHFP1Zr-YUivo1Mm9iy-wavlXambFTM0rY',
            telegramAdminChatId: parsed.settings.telegramAdminChatId || process.env.TELEGRAM_ADMIN_CHAT_ID || '6336803190',
            telegramNotificationsEnabled: parsed.settings.telegramNotificationsEnabled !== undefined ? parsed.settings.telegramNotificationsEnabled : true,
          };
        }
        this.ensureDefaultPlans();
        this.reconcileWithdrawalTransactions();
        this.reconcileUserContracts();
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

  public cleanupSpecificRecords() {
    // Database-first: Do not hardcode or mutate balances, contracts, or users.
    // MongoDB is the sole authority for all data and balances.
    return;
  }

  public reconcileWithdrawalTransactions(): boolean {
    this.cleanupSpecificRecords();
    let modified = false;

    // Remove any leftover transactions for deleted withdrawals
    const activeRefs = new Set(this.withdrawals.map((w) => w.reference).filter(Boolean));
    const activeIds = new Set(this.withdrawals.map((w) => w.id).filter(Boolean));

    const initialTxCount = this.transactions.length;
    this.transactions = this.transactions.filter((t) => {
      if (t.type === 'withdrawal') {
        const hasMatchingWd =
          (t.reference && activeRefs.has(t.reference)) ||
          this.withdrawals.some((w) => (t.id && t.id.includes(w.id.replace('wd_', ''))) || (w.reference && t.reference === w.reference));
        return hasMatchingWd;
      }
      return true;
    });
    if (this.transactions.length !== initialTxCount) {
      modified = true;
    }

    for (const wd of this.withdrawals) {
      if (!wd.reference && !wd.id) continue;
      // Match all transactions by reference, or by wd id in tx id
      const matchingTxs = this.transactions.filter(
        (t) =>
          (wd.reference && t.reference === wd.reference) ||
          (t.type === 'withdrawal' && t.id.includes(wd.id.replace('wd_', '')))
      );

      if (matchingTxs.length === 0) continue;

      // If multiple transactions exist for the exact same withdrawal, keep only the best one
      if (matchingTxs.length > 1) {
        matchingTxs.sort((a, b) => {
          if (a.status === 'completed' && b.status !== 'completed') return -1;
          if (b.status === 'completed' && a.status !== 'completed') return 1;
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });
        const keep = matchingTxs[0];
        const removeIds = new Set(matchingTxs.slice(1).map((t) => t.id));
        this.transactions = this.transactions.filter((t) => !removeIds.has(t.id));
        modified = true;

        if (wd.reference) {
          import('./dbMongo').then(({ deduplicateWithdrawalTransactionsInMongo }) => {
            deduplicateWithdrawalTransactionsInMongo(wd.reference, keep).catch(() => {});
          }).catch(() => {});
        }
      }

      const matchedTx = matchingTxs[0];
      const isApprovedOrCompleted = wd.status === 'approved' || wd.status === 'completed';
      const dest = wd.destination || matchedTx.destination || 'Mobile Wallet';
      const expectedDesc = isApprovedOrCompleted
        ? `Withdrawal to ${dest}`
        : `Withdrawal request to ${dest}`;
      const expectedStatus = isApprovedOrCompleted ? 'completed' : (wd.status === 'rejected' ? 'failed' : 'pending');

      if (
        matchedTx.description !== expectedDesc ||
        matchedTx.destination !== dest ||
        matchedTx.status !== expectedStatus ||
        matchedTx.amount !== wd.amount
      ) {
        matchedTx.description = expectedDesc;
        matchedTx.destination = dest;
        matchedTx.status = expectedStatus as any;
        matchedTx.amount = wd.amount;
        modified = true;
      }
    }
    return modified;
  }


  public reconcileUserContracts(targetUserId?: string): boolean {
    let modified = false;
    const usersToCheck = targetUserId
      ? this.users.filter((u) => u.id === targetUserId)
      : this.users;

    for (const user of usersToCheck) {
      const userActiveContracts = this.miningContracts.filter(
        (c) => c.userId === user.id && c.status === 'active'
      );
      if (user.activeContracts !== userActiveContracts.length) {
        user.activeContracts = userActiveContracts.length;
        modified = true;
      }
    }

    return modified;
  }

  public async saveData() {
    // When MongoDB is configured or connected, MongoDB is the authoritative database.
    // Do NOT write local files and do NOT sync memory to MongoDB.
    if (process.env.MONGODB_URI || process.env.MONGO_URI) {
      return;
    }
    try {
      const { isMongoConnected } = await import('./dbMongo');
      if (isMongoConnected()) {
        return;
      }
    } catch (e) {}

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
    const jsonString = JSON.stringify(data, null, 2);

    try {
      const targetFile = process.env.VERCEL ? TMP_DATA_FILE : DATA_FILE;
      fs.writeFileSync(targetFile, jsonString, 'utf-8');
    } catch (err) {
      // If primary file write fails, ignore
    }
  }

  public async syncToMongo() {
    // CRITICAL: NEVER push in-memory arrays to MongoDB.
    // MongoDB is the sole source of truth. Pushing memory would overwrite manual
    // MongoDB edits and resurrect deleted records.
    return;
  }

  public async syncFromMongo() {
    try {
      const {
        connectMongoDB,
        isMongoConnected,
        getUnifiedMongoDeposits,
        getUnifiedMongoWithdrawals,
        getUnifiedMongoContracts,
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

      let connected = isMongoConnected();
      if (!connected) {
        connected = await connectMongoDB();
      }

      if (!connected) {
        this.cleanupSpecificRecords();
        return;
      }

      const mongoUsers = await UserModel.find().lean();
      if (mongoUsers) {
        this.users = mongoUsers.map((u: any) => ({
          id: u.id,
          username: u.username,
          email: u.email,
          phone: u.phone,
          password: u.password,
          paymentMethod: u.paymentMethod,
          paymentAddress: u.paymentAddress,
          balance: u.balance !== undefined ? u.balance : 0,
          totalDeposits: u.totalDeposits !== undefined ? u.totalDeposits : 0,
          currency: u.currency || 'GHS',
          referralCode: u.referralCode || u.refCode || u.username,
          referredBy: u.referredBy || null,
          vipLevel: u.vipLevel,
          vipTier: u.vipTier,
          claimedMilestones: Array.isArray(u.claimedMilestones) ? u.claimedMilestones : [],
          totalRewards: u.totalRewards !== undefined ? u.totalRewards : 0,
          activeContracts: u.activeContracts !== undefined ? u.activeContracts : 0,
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

      const mongoDeposits = await getUnifiedMongoDeposits();
      if (mongoDeposits && mongoDeposits.length > 0) {
        this.deposits = mongoDeposits;
      } else if (mongoDeposits && this.deposits.length === 0) {
        this.deposits = [];
      }

      // Fetch unified withdrawals across MongoDB collections (respecting direct MongoDB updates & deletions)
      const mongoWithdrawals = await getUnifiedMongoWithdrawals();
      if (mongoWithdrawals) {
        this.withdrawals = mongoWithdrawals;
      }
      this.cleanupSpecificRecords();

      // Fetch unified mining contracts across MongoDB collections (respecting database deletions)
      const mongoContracts = await getUnifiedMongoContracts();
      if (mongoContracts) {
        this.miningContracts = mongoContracts;
      }
      this.reconcileUserContracts();

      const mongoTx = await TransactionModel.find().lean();
      if (mongoTx) {
        const txMap = new Map<string, any>();
        for (const raw of mongoTx) {
          const t: any = {
            id: raw.id,
            userId: raw.userId,
            type: raw.type,
            amount: raw.amount,
            currency: raw.currency || 'GHS',
            reference: raw.reference || '',
            description: raw.description || '',
            status: raw.status || 'completed',
            destination: raw.destination,
            metadata: raw.metadata,
            createdAt: raw.createdAt || new Date().toISOString(),
          };

          // Key by reference if withdrawal/deposit has reference, else key by id
          const key = t.reference ? `${t.type}_${t.reference}` : `id_${t.id}`;
          const existing = txMap.get(key);
          if (!existing) {
            txMap.set(key, t);
          } else {
            // If duplicate exists, keep completed/approved over pending
            if (t.status === 'completed' || t.status === 'approved') {
              txMap.set(key, t);
            }
          }
        }
        this.transactions = Array.from(txMap.values());
      }

      const mongoReferrals = await ReferralModel.find().lean();
      if (mongoReferrals && mongoReferrals.length > 0) {
        this.referrals = mongoReferrals.map((r: any) => ({
          id: r.id,
          referrerId: r.referrerId,
          referredUserId: r.referredUserId || r.refereeId || '',
          referredUsername: r.referredUsername || r.refereeUsername || 'Member',
          referralCode: r.referralCode,
          reward: r.reward ?? r.bonusAmount ?? 0,
          status: r.status || 'completed',
          createdAt: r.createdAt || new Date().toISOString(),
        }));
      }

      const mongoChat = await ChatMessageModel.find().lean();
      if (mongoChat && mongoChat.length > 0) {
        this.chatMessages = mongoChat.map((cm: any) => ({
          id: cm.id,
          username: cm.username || cm.sender || 'Member',
          text: cm.text,
          badge: cm.badge,
          type: cm.type || 'chat',
          createdAt: cm.createdAt || cm.timestamp || new Date().toISOString(),
        }));
      }

      const mongoSettings = await AppSettingsModel.findOne().lean();
      if (mongoSettings) {
        this.settings = {
          ...this.settings,
          ...(mongoSettings as any),
          // Ensure configured environment / newest user addresses take priority if set
          btcAddress: process.env.BTC_DEPOSIT_ADDRESS || (mongoSettings as any).btcAddress || '15512yaegwoVpZ2mjnsZ8mmVdhMnbcYybZ',
          ethAddress: process.env.ETH_DEPOSIT_ADDRESS || (mongoSettings as any).ethAddress || '0x450306b9721d2cc03a70f3c6aa9b7a61b0137b44',
          usdtTrc20Address: process.env.USDT_TRC20_ADDRESS || (mongoSettings as any).usdtTrc20Address || 'TMmpdCUFH9xJ5efivRdyAw8MBVGqdsJmpX',
          usdtErc20Address: process.env.USDT_ERC20_ADDRESS || (mongoSettings as any).usdtErc20Address || '0x450306b9721d2cc03a70f3c6aa9b7a61b0137b44',
          usdtBep20Address: process.env.USDT_BEP20_ADDRESS || (mongoSettings as any).usdtBep20Address || '0x450306b9721d2cc03a70f3c6aa9b7a61b0137b44',
        };
      }

      console.log(`[MongoDB] Synced all records from MongoDB database into active memory (${this.users.length} users active).`);
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
        description: 'Mobile Money Welcome Credit',
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
