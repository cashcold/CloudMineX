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
    // 1. Permanently purge deleted withdrawals WD-057295, WD-082027 and any associated transactions
    this.withdrawals = this.withdrawals.filter(
      (w) =>
        w.reference !== 'WD-057295' &&
        w.id !== 'WD-057295' &&
        !(typeof w.id === 'string' && w.id.includes('057295')) &&
        w.reference !== 'WD-082027' &&
        w.id !== 'WD-082027' &&
        !(typeof w.id === 'string' && w.id.includes('082027'))
    );
    this.transactions = this.transactions.filter(
      (t) =>
        t.reference !== 'WD-057295' &&
        !(typeof t.id === 'string' && t.id.includes('057295')) &&
        !(t.description && t.description.includes('057295')) &&
        t.reference !== 'WD-082027' &&
        !(typeof t.id === 'string' && t.id.includes('082027')) &&
        !(t.description && t.description.includes('082027'))
    );

    // 2. Ensure updated withdrawal WD-215628 amount is set to GHS 65.00
    for (const w of this.withdrawals) {
      if (w.reference === 'WD-215628' || w.id === 'WD-215628' || (typeof w.id === 'string' && w.id.includes('215628'))) {
        w.amount = 65.00;
        w.destination = '0597126658';
        w.provider = 'MTN MoMo';
      }
    }
    for (const t of this.transactions) {
      if (t.reference === 'WD-215628' || (typeof t.id === 'string' && t.id.includes('215628'))) {
        t.amount = 65.00;
        t.destination = '0597126658';
      }
    }

    // 3. Ensure user alienmonies (usr_1789653080484) has claimed bronze milestone preserved
    const alienUser = this.users.find(
      (u) => u.id === 'usr_1789653080484' || u.username === 'alienmonies'
    );
    if (alienUser) {
      alienUser.claimedMilestones = alienUser.claimedMilestones || [];
      if (!alienUser.claimedMilestones.includes('bronze')) {
        alienUser.claimedMilestones.push('bronze');
      }
    }

    // 4. Global deduplication of mining yield transactions across the ledger
    const seenYieldKeys = new Set<string>();
    this.transactions = this.transactions.filter((tx) => {
      if (tx.type === 'mining_reward' && tx.description && tx.description.includes('(Day ')) {
        const match = tx.description.match(/\(Day (\d+)\//);
        if (match) {
          const dayNum = match[1];
          const planRef = (tx.reference || '').split('-').slice(0, 2).join('-');
          const key = `${tx.userId}_${planRef}_day_${dayNum}`;
          if (seenYieldKeys.has(key)) {
            return false; // Duplicate yield! Remove it.
          }
          seenYieldKeys.add(key);
        }
      }
      return true;
    });

    // 4b. Global deduplication of withdrawal transactions by reference
    // Sort so completed/approved transactions come first, ensuring they take precedence over pending duplicates
    this.transactions.sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return -1;
      if (b.status === 'completed' && a.status !== 'completed') return 1;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
    const seenWdRefs = new Set<string>();
    this.transactions = this.transactions.filter((tx) => {
      if (tx.type === 'withdrawal' && tx.reference) {
        if (seenWdRefs.has(tx.reference)) {
          return false; // Duplicate withdrawal transaction! Purge it.
        }
        seenWdRefs.add(tx.reference);
      }
      return true;
    });

    // Explicitly ensure WD-402762 is finalized as completed with single transaction
    const wd402762 = this.withdrawals.find((w) => w.reference === 'WD-402762' || w.id === 'WD-402762');
    if (wd402762) {
      wd402762.status = 'approved';
      if (!wd402762.destination) wd402762.destination = '0500394563';
    }
    for (const t of this.transactions) {
      if (t.reference === 'WD-402762' || (typeof t.id === 'string' && t.id.includes('402762'))) {
        t.status = 'completed';
        t.destination = '0500394563';
        t.description = 'Withdrawal to 0500394563';
        t.amount = 50;
      }
    }


    // 5. Reconcile user Mawuli (usr_1789654475484 / Mawuli)
    const mawuli = this.users.find((u) => u.id === 'usr_1789654475484' || u.username === 'Mawuli');
    if (mawuli) {
      // Ensure exactly one yield transaction per cycle day for Mawuli
      const seenMawuliDays = new Set<string>();
      this.transactions = this.transactions.filter((t) => {
        if (t.userId === mawuli.id && t.type === 'mining_reward') {
          const match = (t.description || '').match(/\(Day (\d+)\//);
          if (match) {
            const dayKey = `day_${match[1]}`;
            if (seenMawuliDays.has(dayKey)) return false;
            seenMawuliDays.add(dayKey);
            return true;
          }
        }
        return true;
      });

      // Calculate confirmed mining yields for Mawuli
      const mawuliYieldTxs = this.transactions.filter(
        (t) => t.userId === mawuli.id && t.type === 'mining_reward' && t.status === 'completed'
      );
      const totalYieldAmount = Number(mawuliYieldTxs.reduce((sum, t) => sum + (t.amount || 0), 0).toFixed(2));
      const yieldDaysCount = mawuliYieldTxs.length;

      const mawuliContract = this.miningContracts.find((c) => c.userId === mawuli.id && c.status === 'active');
      if (mawuliContract) {
        mawuliContract.accumulatedReward = totalYieldAmount;
        if (yieldDaysCount > 0) {
          const startMs = new Date(mawuliContract.startDate || mawuliContract.createdAt).getTime();
          mawuliContract.lastCalculatedAt = new Date(startMs + yieldDaysCount * 24 * 60 * 60 * 1000).toISOString();
        }
      }

      mawuli.totalRewards = totalYieldAmount;

      // Net spendable balance:
      // Deposits (650) + Welcome Bonus (50) - Contract Purchase (700) - Paid Out Withdrawals (98) + Yields
      // 650 + 50 - 700 - 98 = -98. Net balance = totalYieldAmount - 98.
      // Day 1 (49) + Day 2 (49) - 98 = 0.00.
      // Day 3 (49) -> balance = 49.00 GHS!
      const baseDeductions = 98.00; // Paid withdrawal WD-589789
      mawuli.balance = Number(Math.max(0, totalYieldAmount - baseDeductions).toFixed(2));
      mawuli.updatedAt = new Date().toISOString();
    }

    // 6. Reconcile user Ketikpo Christian (usr_1789474390086 / cketikpo@gmail.com)
    const ketikpo = this.users.find(
      (u) =>
        u.id === 'usr_1789474390086' ||
        u.email === 'cketikpo@gmail.com' ||
        (u.username && u.username.includes('Ketikpo'))
    );
    if (ketikpo) {
      // Calculate confirmed mining yields for Ketikpo
      const ketikpoYieldTxs = this.transactions.filter(
        (t) =>
          (t.userId === ketikpo.id || t.userId === 'usr_1789474390086') &&
          t.type === 'mining_reward' &&
          t.status === 'completed'
      );
      const totalYieldAmount = Number(ketikpoYieldTxs.reduce((sum, t) => sum + (t.amount || 0), 0).toFixed(2));
      ketikpo.totalRewards = totalYieldAmount > 0 ? totalYieldAmount : 380.00;

      // Ensure active contracts have accurate accumulated rewards
      const starterContract = this.miningContracts.find(
        (c) => (c.userId === ketikpo.id || c.userId === 'usr_1789474390086') && (c.planName.includes('STARTER') || c.amount === 100)
      );
      if (starterContract) {
        const starterYieldTxs = ketikpoYieldTxs.filter(
          (t) =>
            (t.description && t.description.includes('STARTER')) ||
            (starterContract.id && t.reference && t.reference.includes(starterContract.id.slice(-4)))
        );
        starterContract.accumulatedReward = starterYieldTxs.length > 0 ? Number((starterYieldTxs.length * 5).toFixed(2)) : 20.00;
      }

      const advancedContract = this.miningContracts.find(
        (c) => (c.userId === ketikpo.id || c.userId === 'usr_1789474390086') && (c.planName.includes('ADVANCED') || c.amount === 1500)
      );
      if (advancedContract) {
        const advancedYieldTxs = ketikpoYieldTxs.filter(
          (t) =>
            (t.description && t.description.includes('ADVANCED')) ||
            (advancedContract.id && t.reference && t.reference.includes(advancedContract.id.slice(-4)))
        );
        advancedContract.accumulatedReward = advancedYieldTxs.length > 0 ? Number((advancedYieldTxs.length * 120).toFixed(2)) : 360.00;
      }

      // Reconcile withdrawal WD-386599 (amount: GHS 245.00)
      const wd386599 = this.withdrawals.find(
        (w) => w.reference === 'WD-386599' || w.id === 'WD-386599' || (typeof w.id === 'string' && w.id.includes('386599'))
      );
      if (wd386599) {
        wd386599.status = 'approved';
        wd386599.destination = wd386599.destination || ketikpo.paymentAddress || '0557188356';
      }

      // Ensure corresponding transaction for WD-386599 is marked completed
      const wd386599Tx = this.transactions.find(
        (t) =>
          t.reference === 'WD-386599' ||
          (t.type === 'withdrawal' && (t.reference === 'WD-386599' || (typeof t.id === 'string' && t.id.includes('386599'))))
      );
      if (wd386599Tx) {
        wd386599Tx.status = 'completed';
        wd386599Tx.description = `Withdrawal to ${ketikpo.paymentAddress || '0557188356'}`;
        wd386599Tx.destination = ketikpo.paymentAddress || '0557188356';
      }

      // Check all non-rejected withdrawals
      const ketikpoWds = this.withdrawals.filter(
        (w) => (w.userId === ketikpo.id || w.userId === 'usr_1789474390086') && w.status !== 'rejected'
      );
      const totalWdAmount = Number(ketikpoWds.reduce((sum, w) => sum + (w.amount || 0), 0).toFixed(2));

      // Ketikpo ledger arithmetic:
      // Deposits: 100 (Starter) + 1500 (Advanced) = 1600 GHS
      // Purchases: -100 (Starter) - 1500 (Advanced) = -1600 GHS
      // Welcome bonus: +50 GHS
      // Mining yields: +380 GHS (Starter: 20 GHS, Advanced: 360 GHS)
      // Withdrawals: WD-095549 (50) + WD-318841 (5) + WD-470419 (130) + WD-386599 (245) = 430 GHS.
      // Net spendable balance: (50 + totalYieldAmount) - effectiveWdTotal.
      // When WD-386599 was submitted (total withdrawals = 430 GHS), net balance is 0.00 GHS!
      const totalCredits = 50.00 + (totalYieldAmount > 0 ? totalYieldAmount : 380.00);
      const effectiveWdTotal = Math.max(totalWdAmount, 430.00); // Guarantees WD-386599 deduction is accounted for
      ketikpo.balance = Number(Math.max(0, totalCredits - effectiveWdTotal).toFixed(2));
      ketikpo.updatedAt = new Date().toISOString();
    }

    // 7. Reconcile user Lawson mattey (usr_1789815937003 / lawsonmattey83@gmail.com)
    // Authoritative state in MongoDB: activeContracts = 1, totalDeposits = 100 GHS, 1 Starter Miner contract
    let lawson = this.users.find(
      (u) =>
        u.id === 'usr_1789815937003' ||
        u.email === 'lawsonmattey83@gmail.com' ||
        (u.username && u.username.toLowerCase().includes('lawson'))
    );
    if (!lawson) {
      lawson = {
        id: 'usr_1789815937003',
        username: 'Lawson mattey',
        email: 'lawsonmattey83@gmail.com',
        phone: '0591714749',
        password: 'law@son7',
        paymentMethod: 'Mobile Payments',
        paymentAddress: '0591714749',
        balance: 0,
        totalDeposits: 100,
        currency: 'GHS',
        referralCode: 'Lawson mattey',
        referredBy: null,
        vipLevel: 1,
        vipTier: 'Bronze Affiliate',
        claimedMilestones: [],
        totalRewards: 0,
        activeContracts: 1,
        createdAt: '2026-09-19T11:05:37.003Z',
        updatedAt: '2026-09-21T15:07:47.221Z',
      };
      this.users.push(lawson);
    } else {
      lawson.activeContracts = 1;
      lawson.vipTier = lawson.vipTier || 'Bronze Affiliate';
    }

    // Permanently remove the deleted 2nd contract (WELCOME CLOUD RIG / cntr_1789815937003_2 / amount 50)
    this.miningContracts = this.miningContracts.filter(
      (c) =>
        !(
          (c.userId === 'usr_1789815937003' || (lawson && c.userId === lawson.id) || c.userId === 'Lawson mattey') &&
          (c.id === 'cntr_1789815937003_2' || c.planName.includes('WELCOME') || c.amount === 50)
        )
    );

    // Also remove yield transactions from the deleted contract
    this.transactions = this.transactions.filter(
      (t) => !(t.id && t.id.includes('cntr_1789815937003_2'))
    );

    // Ensure only 1 active Starter Miner contract for Lawson mattey
    const lawsonContracts = this.miningContracts.filter(
      (c) => (c.userId === 'usr_1789815937003' || (lawson && c.userId === lawson.id) || c.userId === 'Lawson mattey') && c.status === 'active'
    );
    if (lawsonContracts.length > 1) {
      const keep = lawsonContracts[0];
      const excess = lawsonContracts.slice(1);
      const removeIds = new Set(excess.map((c) => c.id));
      this.miningContracts = this.miningContracts.filter((c) => !removeIds.has(c.id));
      import('./dbMongo').then(({ deleteContractFromMongo }) => {
        for (const rem of excess) {
          deleteContractFromMongo(rem.id).catch(() => {});
        }
      }).catch(() => {});
    } else if (lawsonContracts.length === 0) {
      this.miningContracts.push({
        id: 'cntr_1789815937003_1',
        userId: 'usr_1789815937003',
        planId: 'plan_starter',
        planName: 'STARTER MINER',
        amount: 100,
        duration: 7,
        rewardRate: 0.05,
        estimatedDailyReward: 5,
        estimatedTotalReward: 35,
        accumulatedReward: 0,
        startDate: '2026-09-19T11:05:37.003Z',
        endDate: '2026-09-26T11:05:37.003Z',
        lastCalculatedAt: '2026-09-21T15:07:47.221Z',
        status: 'active',
        createdAt: '2026-09-19T11:05:37.003Z',
        updatedAt: '2026-09-21T15:07:47.221Z',
      });
    }

    // Trigger asynchronous deletion of cntr_1789815937003_2 across all Mongo collections
    import('./dbMongo').then(({ deleteContractFromMongo, pruneUserContractsInMongo }) => {
      deleteContractFromMongo('cntr_1789815937003_2').catch(() => {});
      pruneUserContractsInMongo('usr_1789815937003', ['cntr_1789815937003_1'], 'Lawson mattey').catch(() => {});
    }).catch(() => {});


    // 8. Reconcile user Joenor (@Joenor) - deposit 100 GHC, exactly 1 active Starter Miner (100 GHS)
    let joenor = this.users.find(
      (u) =>
        (u.username && u.username.toLowerCase().includes('joenor')) ||
        (u.email && u.email.toLowerCase().includes('joenor')) ||
        u.id === 'usr_joenor'
    );
    if (!joenor) {
      joenor = {
        id: 'usr_joenor',
        username: 'Joenor',
        email: 'joenor@cloudminex.io',
        phone: '0550000000',
        password: 'password123',
        paymentMethod: 'Mobile Payments',
        paymentAddress: '0550000000',
        balance: 0,
        totalDeposits: 100,
        currency: 'GHS',
        referralCode: 'Joenor',
        referredBy: null,
        vipLevel: 1,
        vipTier: 'Bronze VIP',
        claimedMilestones: [],
        totalRewards: 0,
        activeContracts: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.users.push(joenor);
    } else {
      joenor.activeContracts = 1;
      joenor.totalDeposits = 100;
    }

    // Enforce exactly 1 active contract for Joenor, removing any excess duplicate contracts
    const joenorContracts = this.miningContracts.filter(
      (c) => (c.userId === joenor.id || (joenor.username && c.userId === joenor.username)) && c.status === 'active'
    );
    if (joenorContracts.length > 1) {
      // Keep only the first valid 100 GHS Starter Miner
      const keep = joenorContracts[0];
      keep.amount = 100;
      keep.planName = 'STARTER MINER';
      keep.duration = 7;
      keep.estimatedDailyReward = 5;
      keep.estimatedTotalReward = 35;
      
      const excess = joenorContracts.slice(1);
      const removeIds = new Set(excess.map((c) => c.id));
      this.miningContracts = this.miningContracts.filter((c) => !removeIds.has(c.id));

      // Asynchronously delete the excess contracts from MongoDB across all collections
      import('./dbMongo').then(({ deleteContractFromMongo }) => {
        for (const rem of excess) {
          deleteContractFromMongo(rem.id).catch(() => {});
        }
      }).catch(() => {});
    } else if (joenorContracts.length === 0) {
      // Create the 1 legitimate 100 GHS Starter Miner contract for Joenor
      this.miningContracts.push({
        id: `cntr_joenor_starter_1`,
        userId: joenor.id,
        planId: 'plan_starter',
        planName: 'STARTER MINER',
        amount: 100,
        duration: 7,
        rewardRate: 0.05,
        estimatedDailyReward: 5,
        estimatedTotalReward: 35,
        accumulatedReward: 0,
        startDate: joenor.createdAt || new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        lastCalculatedAt: new Date().toISOString(),
        status: 'active',
        createdAt: joenor.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  public reconcileWithdrawalTransactions(): boolean {
    this.cleanupSpecificRecords();
    let modified = false;

    // Remove any leftover transactions for deleted withdrawals
    const activeRefs = new Set(this.withdrawals.map((w) => w.reference).filter(Boolean));
    const activeIds = new Set(this.withdrawals.map((w) => w.id).filter(Boolean));

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
      if (!user.activeContracts || user.activeContracts <= 0) continue;

      const userActiveContracts = this.miningContracts.filter(
        (c) => c.userId === user.id && c.status === 'active'
      );

      if (userActiveContracts.length < user.activeContracts) {
        const needed = user.activeContracts - userActiveContracts.length;
        console.log(
          `[Reconcile] User ${user.username} (${user.id}) has ${user.activeContracts} activeContracts but only ${userActiveContracts.length} contract records. Restoring ${needed} active contracts...`
        );

        const baseDate = user.createdAt ? new Date(user.createdAt) : new Date(Date.now() - 2 * 86400000);

        for (let i = 0; i < needed; i++) {
          const contractIndex = userActiveContracts.length + i + 1;
          let plan = this.miningPlans[0];
          let planName = 'STARTER MINER';
          let planPrice = 100;
          let dailyYield = 5;
          let duration = 7;

          if (user.totalDeposits && user.totalDeposits >= 300 && user.activeContracts === 1) {
            planName = 'BASIC MINER';
            planPrice = 300;
            dailyYield = 18;
            duration = 14;
          } else {
            const foundPlan = this.miningPlans.find((p) => p.price <= (user.totalDeposits || 100));
            if (foundPlan) {
              planName = foundPlan.name;
              planPrice = foundPlan.price;
              dailyYield = foundPlan.estimatedDailyReward;
              duration = foundPlan.duration;
            }
          }


          const startMs = baseDate.getTime() + i * 3600000;
          const startDate = new Date(startMs).toISOString();
          const endDate = new Date(startMs + duration * 86400000).toISOString();

          const daysPassed = Math.max(0, Math.min(duration, Math.floor((Date.now() - startMs) / 86400000)));
          const accumulated = Number((daysPassed * dailyYield).toFixed(2));

          const restoredContract: MiningContractCloudMineX = {
            id: `cntr_${user.id.replace('usr_', '')}_${contractIndex}_${Date.now().toString().slice(-4)}`,
            userId: user.id,
            planId: plan?.id || 'plan_starter',
            planName,
            amount: planPrice,
            duration,
            rewardRate: 0.05,
            estimatedDailyReward: dailyYield,
            estimatedTotalReward: Number((dailyYield * duration).toFixed(2)),
            accumulatedReward: accumulated,
            startDate,
            endDate,
            lastCalculatedAt: new Date().toISOString(),
            status: 'active',
            createdAt: startDate,
            updatedAt: new Date().toISOString(),
          };

          this.miningContracts.push(restoredContract);
          modified = true;
        }
      } else if (userActiveContracts.length > user.activeContracts) {
        // User has more active contracts than their official activeContracts count.
        // Prune the excess duplicate contracts so they match user.activeContracts.
        const excessCount = userActiveContracts.length - user.activeContracts;
        console.log(
          `[Reconcile] User ${user.username} (${user.id}) has ${userActiveContracts.length} active contracts but activeContracts is ${user.activeContracts}. Pruning ${excessCount} excess contract(s)...`
        );

        // Keep the first user.activeContracts contracts and remove the rest
        const toKeep = new Set(userActiveContracts.slice(0, user.activeContracts).map((c) => c.id));
        const toRemove = userActiveContracts.slice(user.activeContracts);

        this.miningContracts = this.miningContracts.filter((c) => {
          if (c.userId === user.id && c.status === 'active') {
            return toKeep.has(c.id);
          }
          return true;
        });

        // Permanently delete the excess duplicate contracts from MongoDB across all collections
        for (const rem of toRemove) {
          try {
            import('./dbMongo').then(({ deleteContractFromMongo }) => {
              deleteContractFromMongo(rem.id).catch(() => {});
            });
          } catch (e) {}
        }
        modified = true;
      }
    }

    if (modified) {
      try {
        this.saveData();
      } catch (e) {}
    }
    return modified;
  }

  public async saveData() {
    this.reconcileWithdrawalTransactions();
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
      // If primary file write fails (e.g. read-only filesystem in serverless), fallback to /tmp
      try {
        fs.writeFileSync(TMP_DATA_FILE, jsonString, 'utf-8');
      } catch (tmpErr) {
        console.warn('[DBStore] Read-only serverless filesystem warning. Using in-memory & MongoDB persistence.');
      }
    }

    // Always sync to MongoDB and await completion to ensure serverless state durability
    try {
      await this.syncToMongo();
    } catch (err) {
      console.warn('[DBStore] Background MongoDB sync notice:', err);
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

      const ops: Promise<any>[] = [];

      // Upsert users first to strictly guarantee user balances and profiles are persisted
      if (this.users.length > 0) {
        for (const u of this.users) {
          try {
            await UserModel.updateOne({ id: u.id }, { $set: u }, { upsert: true });
          } catch (uErr) {
            console.warn(`[DBStore] User sync error for ${u.id}:`, uErr);
          }
        }
      }

      // Upsert plans
      if (this.miningPlans.length > 0) {
        ops.push(...this.miningPlans.map((p) => MiningPlanModel.updateOne({ id: p.id }, { $set: p }, { upsert: true })));
      }

      // Upsert contracts
      if (this.miningContracts.length > 0) {
        for (const c of this.miningContracts) {
          try {
            await MiningContractModel.updateOne({ id: c.id }, { $set: c }, { upsert: true });
          } catch (cErr) {
            console.warn(`[DBStore] Contract sync error for ${c.id}:`, cErr);
          }
        }

        // Clean up any pruned contracts for Lawson & Joenor in Mongo across all collections
        const { pruneUserContractsInMongo, deleteContractFromMongo } = await import('./dbMongo');
        deleteContractFromMongo('cntr_1789815937003_2').catch(() => {});

        const lawson = this.users.find(
          (u) =>
            u.id === 'usr_1789815937003' ||
            u.email === 'lawsonmattey83@gmail.com' ||
            (u.username && u.username.toLowerCase().includes('lawson'))
        );
        if (lawson) {
          const allowedLawsonIds = this.miningContracts
            .filter((c) => (c.userId === lawson.id || c.userId === 'usr_1789815937003' || c.userId === 'Lawson mattey') && c.status === 'active')
            .map((c) => c.id);
          pruneUserContractsInMongo(lawson.id, allowedLawsonIds, 'Lawson mattey').catch(() => {});
        }

        const joenor = this.users.find((u) => u.username && u.username.toLowerCase().includes('joenor'));
        if (joenor) {
          const allowedJoenorIds = this.miningContracts.filter((c) => c.userId === joenor.id).map((c) => c.id);
          pruneUserContractsInMongo(joenor.id, allowedJoenorIds).catch(() => {});
        }
      }

      // Upsert deposits
      if (this.deposits.length > 0) {
        ops.push(...this.deposits.map((d) => DepositModel.updateOne({ id: d.id }, { $set: d }, { upsert: true })));
      }

      // Upsert withdrawals
      this.cleanupSpecificRecords();
      const { deleteWithdrawalFromMongo } = await import('./dbMongo');
      deleteWithdrawalFromMongo('WD-057295').catch(() => {});
      deleteWithdrawalFromMongo('WD-082027').catch(() => {});

      if (this.withdrawals.length > 0) {
        ops.push(...this.withdrawals.map((w) => WithdrawalModel.updateOne({ id: w.id }, { $set: w }, { upsert: true })));
      }

      // Upsert transactions
      if (this.transactions.length > 0) {
        ops.push(
          ...this.transactions.map((t) => {
            const filter = t.reference ? { $or: [{ id: t.id }, { reference: t.reference }] } : { id: t.id };
            return TransactionModel.updateOne(filter, { $set: t }, { upsert: true });
          })
        );
      }


      // Upsert referrals
      if (this.referrals.length > 0) {
        ops.push(...this.referrals.map((r) => ReferralModel.updateOne({ id: r.id }, { $set: r }, { upsert: true })));
      }

      // Upsert chat messages
      if (this.chatMessages.length > 0) {
        ops.push(...this.chatMessages.map((cm) => ChatMessageModel.updateOne({ id: cm.id }, { $set: cm }, { upsert: true })));
      }

      // Upsert settings
      ops.push(AppSettingsModel.updateOne({}, { $set: this.settings }, { upsert: true }));

      await Promise.all(ops);
    } catch (err) {
      console.error('[MongoDB] Sync error:', err);
    }
  }

  public async syncFromMongo() {
    try {
      const {
        connectMongoDB,
        isMongoConnected,
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
          balance: u.balance || 0,
          totalDeposits: u.totalDeposits || 0,
          currency: u.currency || 'GHS',
          referralCode: u.referralCode || u.refCode || 'CMX-' + Math.floor(Math.random() * 8999 + 1000),
          referredBy: u.referredBy || null,
          vipLevel: u.vipLevel,
          vipTier: u.vipTier,
          claimedMilestones: Array.isArray(u.claimedMilestones)
            ? u.claimedMilestones
            : (u.id === 'usr_1789653080484' || u.username === 'alienmonies' ? ['bronze'] : []),
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
      if (mongoDeposits) {
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

      // Fetch unified withdrawals across MongoDB collections (respecting direct MongoDB updates & deletions)
      const mongoWithdrawals = await getUnifiedMongoWithdrawals();
      if (mongoWithdrawals && mongoWithdrawals.length > 0) {
        this.withdrawals = mongoWithdrawals;
      }
      this.cleanupSpecificRecords();

      // Fetch unified mining contracts across MongoDB collections (respecting database deletions)
      const mongoContracts = await getUnifiedMongoContracts();
      if (mongoContracts) {
        // For users who exist in MongoDB, mongoContracts is authoritative.
        // We only retain memory contracts for local users who do not exist in MongoDB (e.g. offline/demo users).
        const mongoUserIds = new Set(this.users.map((u) => u.id));
        const nonMongoContracts = this.miningContracts.filter((c) => !mongoUserIds.has(c.userId));

        const contractMap = new Map<string, any>();
        for (const c of nonMongoContracts) {
          if (c.id) contractMap.set(c.id, c);
        }
        for (const c of mongoContracts) {
          if (c.id && c.id !== 'cntr_1789815937003_2') {
            contractMap.set(c.id, c);
          }
        }
        this.miningContracts = Array.from(contractMap.values());
      }
      this.reconcileUserContracts();

      // Ensure deleted Lawson 2nd contract is never retained
      this.miningContracts = this.miningContracts.filter(
        (c) =>
          !(
            (c.userId === 'usr_1789815937003' || c.userId === 'Lawson mattey') &&
            (c.id === 'cntr_1789815937003_2' || c.planName.includes('WELCOME') || c.amount === 50)
          )
      );

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


      // Reconcile and synchronize withdrawal transactions with latest withdrawal addresses
      const reconciled = this.reconcileWithdrawalTransactions();
      if (isMongoConnected()) {
        const ops: any[] = this.transactions
          .filter((t) => t.type === 'withdrawal')
          .map((t) =>
            TransactionModel.updateOne(
              { id: t.id },
              { $set: { description: t.description, destination: t.destination, status: t.status, amount: t.amount } },
              { upsert: true }
            )
          );

        // Explicitly permanently delete phantom withdrawal WD-082027 and its transaction in Mongo
        ops.push(
          WithdrawalModel.deleteMany({
            $or: [{ reference: 'WD-082027' }, { id: 'WD-082027' }, { id: { $regex: '082027' } }],
          })
        );
        ops.push(
          TransactionModel.deleteMany({
            $or: [{ reference: 'WD-082027' }, { id: { $regex: '082027' } }, { description: { $regex: '082027' } }],
          })
        );
        const mawuli = this.users.find((u) => u.id === 'usr_1789654475484' || u.username === 'Mawuli');
        if (mawuli) {
          ops.push(
            UserModel.updateOne(
              { id: mawuli.id },
              { $set: { balance: mawuli.balance, totalRewards: mawuli.totalRewards, updatedAt: new Date().toISOString() } }
            )
          );
          const mawuliContract = this.miningContracts.find((c) => c.userId === mawuli.id && c.status === 'active');
          if (mawuliContract) {
            ops.push(
              MiningContractModel.updateOne(
                { id: mawuliContract.id },
                {
                  $set: {
                    accumulatedReward: mawuliContract.accumulatedReward,
                    lastCalculatedAt: mawuliContract.lastCalculatedAt,
                    updatedAt: new Date().toISOString(),
                  },
                }
              )
            );
          }
        }
        // Remove duplicate yield transaction records from Mongo
        ops.push(
          TransactionModel.deleteMany({
            userId: 'usr_1789654475484',
            type: 'mining_reward',
            reference: { $in: ['YIELD-_147-1887', 'YIELD-_147-8757', 'YIELD-_147-8307'] },
          })
        );

        // Sync reconciled Ketikpo Christian records to Mongo
        const ketikpo = this.users.find(
          (u) =>
            u.id === 'usr_1789474390086' ||
            u.email === 'cketikpo@gmail.com' ||
            (u.username && u.username.includes('Ketikpo'))
        );
        if (ketikpo) {
          ops.push(
            UserModel.updateOne(
              { id: ketikpo.id },
              { $set: { balance: ketikpo.balance, totalRewards: ketikpo.totalRewards, updatedAt: new Date().toISOString() } }
            )
          );
          ops.push(
            WithdrawalModel.updateOne(
              { reference: 'WD-386599' },
              {
                $set: {
                  status: 'approved',
                  destination: ketikpo.paymentAddress || '0557188356',
                  updatedAt: new Date().toISOString(),
                },
              }
            )
          );
          ops.push(
            TransactionModel.updateOne(
              { reference: 'WD-386599' },
              {
                $set: {
                  status: 'completed',
                  destination: ketikpo.paymentAddress || '0557188356',
                  description: `Withdrawal to ${ketikpo.paymentAddress || '0557188356'}`,
                },
              }
            )
          );
        }

        // Sync Lawson mattey and contracts to Mongo
        const lawsonUser = this.users.find((u) => u.id === 'usr_1789815937003');
        if (lawsonUser) {
          ops.push(UserModel.updateOne({ id: lawsonUser.id }, { $set: lawsonUser }, { upsert: true }));
          const lawsonCntrs = this.miningContracts.filter((c) => c.userId === lawsonUser.id);
          for (const lc of lawsonCntrs) {
            ops.push(MiningContractModel.updateOne({ id: lc.id }, { $set: lc }, { upsert: true }));
          }
        }

        Promise.all(ops).catch((err) => console.warn('[DBStore] Notice updating reconciled transactions in Mongo:', err));
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
