import { Router, Request, Response } from 'express';
import {
  db,
  UserCloudMineX,
  MiningPlanCloudMineX,
  MiningContractCloudMineX,
  DepositCloudMineX,
  WithdrawalCloudMineX,
  TransactionCloudMineX,
} from '../config/dbStore';
import { calculateEstimatedReward, processMiningYields, processMiningYieldsAsync } from '../services/rewardEngine';
import { getCryptoRates, convertFiatToCrypto, getMarketTickers } from '../services/cryptoPriceService';
import { mobileMoneyProvider } from '../services/payment/mobileMoneyProvider';
import { cryptoProvider } from '../services/payment/cryptoProvider';
import { sendPasswordResetEmail } from '../services/emailService';
import {
  sendWithdrawalNotification,
  sendDepositNotification,
  sendTelegramTestAlert,
  getTelegramBotToken,
  getTelegramAdminChatId,
} from '../services/telegramService';
import {
  UserModel,
  MiningPlanModel,
  MiningContractModel,
  DepositModel,
  WithdrawalModel,
  TransactionModel,
  ReferralModel,
  AppSettingsModel,
  isMongoConnected,
  ensureMongoConnected,
  getUnifiedMongoWithdrawals,
  getUnifiedMongoContracts,
} from '../config/dbMongo';

export const apiRouter = Router();

// Milestone Roadmap & Affiliate Tier Definitions
export const AFFILIATE_MILESTONES = [
  {
    id: 'bronze',
    level: 1,
    name: 'BRONZE',
    title: 'Bronze Affiliate',
    requiredRefs: 1,
    perk: '10% First Deposit Comm',
    rewardText: '10% First Deposit Comm',
    rewardUsd: 0,
    rewardGhs: 0,
    isAutomaticCommission: true,
    extraComm: 0.10, // 10% First Deposit Comm
    color: '#D97706',
  },
  {
    id: 'silver',
    level: 2,
    name: 'SILVER',
    title: 'Silver Ambassador',
    requiredRefs: 5,
    perk: 'Priority Support & Fast Withdrawals',
    rewardText: '$15 Instant Bonus + 1% Extra Comm',
    rewardUsd: 15,
    rewardGhs: 225,
    extraComm: 0.11, // 10% + 1% = 11%
    color: '#94A3B8',
  },
  {
    id: 'gold',
    level: 3,
    name: 'GOLD',
    title: 'Gold Partner',
    requiredRefs: 12,
    perk: 'Custom Referral Link & Manager',
    rewardText: '$25 VIP Partner Reward',
    rewardUsd: 25,
    rewardGhs: 375,
    extraComm: 0.11,
    color: '#EAB308',
  },
  {
    id: 'platinum',
    level: 4,
    name: 'PLATINUM',
    title: 'Platinum Director',
    requiredRefs: 25,
    perk: '0% Withdrawal Fees & Exclusive Webinars',
    rewardText: '$50 Executive Cash Pool',
    rewardUsd: 50,
    rewardGhs: 750,
    extraComm: 0.12,
    color: '#2DD4FF',
  },
  {
    id: 'diamond',
    level: 5,
    name: 'DIAMOND',
    title: 'Diamond Legend',
    requiredRefs: 50,
    perk: 'VIP Regional Ambassador Status',
    rewardText: '$100 Global Profit Share',
    rewardUsd: 100,
    rewardGhs: 1500,
    extraComm: 0.13,
    color: '#A855F7',
  },
];

export const getFundedReferralsCount = (userId: string): number => {
  const referredUsers = db.users.filter((u) => u.referredBy === userId);
  const userRefs = db.referrals.filter((r) => r.referrerId === userId);
  
  const allReferredIds = new Set<string>();
  referredUsers.forEach((u) => allReferredIds.add(u.id));
  userRefs.forEach((r) => {
    if (r.referredUserId) allReferredIds.add(r.referredUserId);
  });

  let fundedCount = 0;
  allReferredIds.forEach((referredId) => {
    const userObj = db.users.find((u) => u.id === referredId);
    const confirmedDeps = db.deposits.filter((d) => d.userId === referredId && d.status === 'confirmed');
    const isFunded = (userObj && (userObj.totalDeposits || 0) > 0) || confirmedDeps.length > 0;
    if (isFunded) {
      fundedCount++;
    }
  });

  return fundedCount;
};

const isFirstConfirmedDeposit = (userId: string, currentDepositId: string) => {
  return (
    db.deposits.filter(
      (d) =>
        d.userId === userId &&
        d.status === 'confirmed' &&
        d.id !== currentDepositId
    ).length === 0
  );
};

const creditReferralBonus = (user: UserCloudMineX, deposit: DepositCloudMineX) => {
  if (!user.referredBy) return;

  const referrer = db.users.find((u) => u.id === user.referredBy);
  if (!referrer) return;

  // STRICT REQUIREMENT: Only pay referral bonus on the first confirmed deposit of the referred user
  if (!isFirstConfirmedDeposit(user.id, deposit.id)) return;

  // Calculate commission rate based on referrer's milestone tier
  const referrerFundedCount = getFundedReferralsCount(referrer.id);
  let commRate = 0.10; // Default 10% First Deposit Commission (Bronze)
  if (referrerFundedCount >= 50) commRate = 0.13;
  else if (referrerFundedCount >= 25) commRate = 0.12;
  else if (referrerFundedCount >= 5) commRate = 0.11;

  const bonusAmount = Number((deposit.amount * commRate).toFixed(2));

  referrer.balance = Number((referrer.balance + bonusAmount).toFixed(2));
  referrer.totalRewards = Number(((referrer.totalRewards || 0) + bonusAmount).toFixed(2));
  referrer.updatedAt = new Date().toISOString();

  const refRecord = db.referrals.find((r) => r.referredUserId === user.id);
  if (refRecord) {
    refRecord.reward = Number((refRecord.reward + bonusAmount).toFixed(2));
    refRecord.status = 'funded';
  }

  db.transactions.unshift({
    id: `tx_ref_bonus_${Date.now()}`,
    userId: referrer.id,
    type: 'deposit',
    amount: bonusAmount,
    currency: referrer.currency || 'GHS',
    reference: `REF-BONUS-${user.username.toUpperCase()}`,
    description: `${(commRate * 100).toFixed(0)}% First Deposit Referral Commission from ${user.username}`,
    status: 'completed',
    createdAt: new Date().toISOString(),
  });

  if (isMongoConnected()) {
    try {
      UserModel.updateOne(
        { id: referrer.id },
        {
          $set: {
            balance: referrer.balance,
            totalRewards: referrer.totalRewards,
            vipTier: referrer.vipTier,
            updatedAt: referrer.updatedAt,
          },
        }
      ).catch((e) => console.error('[MongoDB] Referral commission sync error:', e));
    } catch (e) {
      console.error('[MongoDB] Referrer update error:', e);
    }
  }
};

// ================= USER & AUTH ENDPOINTS (MONGODB AUTHORITATIVE) =================

export function findUserByQuery(rawQuery: string): UserCloudMineX | null {
  if (!rawQuery) return null;
  const clean = rawQuery.trim();
  const lower = clean.toLowerCase();
  const digitsOnly = clean.replace(/\D/g, '');

  // 1. Direct match on username or email or phone
  let user = db.users.find(
    (u) =>
      (u.username && u.username.toLowerCase() === lower) ||
      (u.email && u.email.toLowerCase() === lower) ||
      (u.phone && u.phone.trim() === clean)
  );
  if (user) return user;

  // 2. Phone match by trailing digits (at least 7 digits)
  if (digitsOnly && digitsOnly.length >= 7) {
    user = db.users.find(
      (u) => u.phone && u.phone.replace(/\D/g, '').endsWith(digitsOnly.slice(-9))
    );
    if (user) return user;
  }

  // 3. Email query matching username (e.g., query 'cashcold99@gmail.com' -> matches username 'cashcold99')
  if (lower.includes('@')) {
    const prefix = lower.split('@')[0].trim();
    user = db.users.find(
      (u) =>
        (u.username && u.username.toLowerCase() === prefix) ||
        (u.email && u.email.split('@')[0].toLowerCase() === prefix)
    );
    if (user) return user;
  }

  // 4. Username query matching email prefix (e.g. query 'cashcold99' matches 'cashcold99@gmail.com')
  user = db.users.find(
    (u) =>
      u.email &&
      (u.email.toLowerCase() === `${lower}@cloudminex.io` ||
       u.email.toLowerCase() === `${lower}@gmail.com` ||
       u.email.split('@')[0].toLowerCase() === lower)
  );

  return user || null;
}

// Live asynchronous finder that prioritizes MongoDB Atlas as the single source of truth
export async function findUserLive(rawQuery: string): Promise<UserCloudMineX | null> {
  if (!rawQuery) return null;
  const clean = rawQuery.trim();
  const lower = clean.toLowerCase();
  const digitsOnly = clean.replace(/\D/g, '');

  // 1. If MongoDB is connected, query MongoDB Atlas directly
  if (isMongoConnected()) {
    try {
      const safeEscaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const conditions: any[] = [
        { username: new RegExp('^' + safeEscaped + '$', 'i') },
        { email: new RegExp('^' + safeEscaped + '$', 'i') },
        { phone: clean },
      ];

      if (digitsOnly && digitsOnly.length >= 7) {
        conditions.push({ phone: new RegExp(digitsOnly.slice(-9) + '$') });
      }

      if (lower.includes('@')) {
        const prefix = lower.split('@')[0].trim();
        const prefixEscaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        conditions.push({ username: new RegExp('^' + prefixEscaped + '$', 'i') });
      }

      const mongoDoc: any = await UserModel.findOne({ $or: conditions } as any).lean();
      if (mongoDoc) {
        const userObj: UserCloudMineX = {
          id: mongoDoc.id,
          username: mongoDoc.username,
          email: mongoDoc.email,
          phone: mongoDoc.phone,
          password: mongoDoc.password,
          paymentMethod: mongoDoc.paymentMethod,
          paymentAddress: mongoDoc.paymentAddress,
          balance: mongoDoc.balance || 0,
          totalDeposits: mongoDoc.totalDeposits || 0,
          currency: mongoDoc.currency || 'GHS',
          referralCode: mongoDoc.referralCode || mongoDoc.username,
          referredBy: mongoDoc.referredBy || null,
          vipLevel: mongoDoc.vipLevel || 1,
          vipTier: mongoDoc.vipTier || 'Bronze VIP',
          totalRewards: mongoDoc.totalRewards || 0,
          activeContracts: mongoDoc.activeContracts || 0,
          createdAt: mongoDoc.createdAt || new Date().toISOString(),
          updatedAt: mongoDoc.updatedAt || new Date().toISOString(),
        };

        // Keep local cache in sync
        const idx = db.users.findIndex((u) => u.id === userObj.id);
        if (idx >= 0) {
          db.users[idx] = userObj;
        } else {
          db.users.push(userObj);
        }
        return userObj;
      } else {
        // If not found in MongoDB, it means the user was deleted in MongoDB directly!
        // Remove from local memory cache so deletions in Mongo immediately take effect
        const hadInCache = db.users.some(
          (u) =>
            u.username.toLowerCase() === lower ||
            (u.email && u.email.toLowerCase() === lower) ||
            u.phone === clean
        );
        if (hadInCache) {
          db.users = db.users.filter(
            (u) =>
              u.username.toLowerCase() !== lower &&
              (u.email ? u.email.toLowerCase() !== lower : true) &&
              u.phone !== clean
          );
          db.saveData();
        }
        return null;
      }
    } catch (err: any) {
      console.warn('[MongoDB] Live query error, checking memory cache:', err.message);
    }
  }

  // Fallback to local store if MongoDB is not reachable
  return findUserByQuery(rawQuery);
}

apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username) {
    return res.status(400).json({ success: false, message: 'Username, email, or phone number is required.' });
  }

  const user = await findUserLive(username);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Account not found. Please register first to create an account.',
    });
  }

  // If user has a set password and password was entered, verify it
  if (user.password && password && user.password !== password) {
    return res.status(401).json({
      success: false,
      message: 'Incorrect password. Please verify or use "Forgot Password" to reset.',
    });
  }

  // If user has no password set and logged in, set this password
  if (!user.password && password) {
    user.password = password.trim();
    user.updatedAt = new Date().toISOString();
    db.saveData();
    if (isMongoConnected()) {
      try {
        await UserModel.updateOne({ id: user.id }, { $set: { password: user.password, updatedAt: user.updatedAt } });
      } catch (e) {}
    }
  }

  res.json({
    success: true,
    message: `Welcome back, ${user.username}!`,
    user,
  });
});

apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { username, phone, email, password, referralCode, paymentMethod, paymentAddress } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({ success: false, message: 'Username is required.' });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email ? email.trim().toLowerCase() : '';

    // Check directly against MongoDB
    const existingUser = (await findUserLive(cleanUsername)) || (cleanEmail ? await findUserLive(cleanEmail) : null);

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `An account with username "${cleanUsername}" or email "${cleanEmail}" already exists. Please log in with your password, or use the "Reset" tab to set a new password.`,
      });
    }

    // Find referrer if referralCode provided (matching username or referralCode)
    let referrer = null;
    if (referralCode && typeof referralCode === 'string' && referralCode.trim()) {
      const codeTrimmed = referralCode.trim().toLowerCase();
      referrer = await findUserLive(codeTrimmed);
      if (!referrer) {
        referrer = db.users.find(
          (u) =>
            (u.username && u.username.toLowerCase() === codeTrimmed) ||
            (u.referralCode && u.referralCode.toLowerCase() === codeTrimmed)
        );
      }
    }

    const newUser: UserCloudMineX = {
      id: `usr_${Date.now()}`,
      username: cleanUsername,
      email: cleanEmail || `${cleanUsername.toLowerCase()}@cloudminex.io`,
      phone: phone ? phone.trim() : '+233 24 000 0000',
      password: password ? password.trim() : undefined,
      paymentMethod: paymentMethod || 'Mobile Payments',
      paymentAddress: paymentAddress || phone || 'Not specified',
      balance: 50.0, // Welcome signup bonus
      totalDeposits: 0,
      currency: 'GHS',
      activeContracts: 0,
      totalRewards: 0,
      referralCode: cleanUsername, // Use username as referral code parameter
      referredBy: referrer ? referrer.id : null,
      vipLevel: 1,
      vipTier: 'Bronze VIP',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to local cache
    db.users.push(newUser);

    // Link in db.referrals if referrer exists
    if (referrer) {
      db.referrals.push({
        id: `ref_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        referrerId: referrer.id,
        referredUserId: newUser.id,
        referredUsername: newUser.username,
        createdAt: new Date().toISOString(),
        reward: 0, // Rewarded upon deposit
        status: 'pending', // Pending deposit
      });
    }

    // Record Welcome Bonus Transaction
    db.transactions.unshift({
      id: `tx_welcome_${Date.now()}`,
      userId: newUser.id,
      type: 'deposit',
      amount: 50.0,
      currency: 'GHS',
      reference: `WELCOME-BONUS-${newUser.id.slice(-4)}`,
      description: 'Welcome Bonus Credit',
      status: 'completed',
      createdAt: new Date().toISOString(),
    });

    db.saveData();

    // Directly save to MongoDB as the main heart
    if (isMongoConnected()) {
      try {
        await UserModel.create(newUser);
        console.log(`[MongoDB] Created new user document for "${newUser.username}" in MongoDB!`);
      } catch (mErr: any) {
        console.warn('[MongoDB] MongoDB creation note:', mErr.message);
      }
    }

    return res.json({
      success: true,
      message: 'Account created successfully! Enjoy your GHS 50 welcome credit.',
      user: newUser,
    });
  } catch (error: any) {
    console.error('[Auth] Registration error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred during registration. Please try again.',
    });
  }
});

// ================= PASSWORD RESET WITH 6-DIGIT EMAIL CODE =================

// 1. Request Password Reset OTP to Email
apiRouter.post('/auth/forgot-password', async (req: Request, res: Response) => {
  const { emailOrUsername } = req.body;

  if (!emailOrUsername || !emailOrUsername.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Please enter your registered email, username, or phone number.',
    });
  }

  const query = emailOrUsername.trim();
  const user = await findUserLive(query);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: `No account found for "${query}". Please check your spelling or register a new account.`,
    });
  }

  // If user provided a valid email in query and user's saved email is a placeholder or different, update it
  if (query.includes('@') && query.includes('.')) {
    user.email = query.toLowerCase();
    user.updatedAt = new Date().toISOString();
    db.saveData();
    if (isMongoConnected()) {
      try {
        await UserModel.updateOne({ id: user.id }, { $set: { email: user.email, updatedAt: user.updatedAt } });
      } catch (e) {}
    }
  }

  // Determine destination email
  let targetEmail = user.email;
  if (!targetEmail || !targetEmail.includes('@') || targetEmail.endsWith('@cloudminex.io')) {
    if (query.includes('@')) {
      targetEmail = query.toLowerCase();
      user.email = targetEmail;
      db.saveData();
      if (isMongoConnected()) {
        try {
          await UserModel.updateOne({ id: user.id }, { $set: { email: user.email, updatedAt: user.updatedAt } });
        } catch (e) {}
      }
    } else {
      targetEmail = `${user.username.toLowerCase()}@gmail.com`;
    }
  }

  // Generate 6-digit numeric OTP code
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Clear previous OTPs for this user
  db.passwordResetOtps = db.passwordResetOtps.filter(
    (o) =>
      o.emailOrUsername.toLowerCase() !== user.username.toLowerCase() &&
      o.emailOrUsername.toLowerCase() !== (user.email || '').toLowerCase() &&
      o.emailOrUsername.toLowerCase() !== query.toLowerCase() &&
      o.expiresAt > Date.now()
  );

  // Store new OTP indexed by targetEmail, username, and query
  db.passwordResetOtps.push({
    emailOrUsername: targetEmail.toLowerCase(),
    code: otpCode,
    expiresAt,
  });
  db.passwordResetOtps.push({
    emailOrUsername: user.username.toLowerCase(),
    code: otpCode,
    expiresAt,
  });
  if (query.toLowerCase() !== targetEmail.toLowerCase() && query.toLowerCase() !== user.username.toLowerCase()) {
    db.passwordResetOtps.push({
      emailOrUsername: query.toLowerCase(),
      code: otpCode,
      expiresAt,
    });
  }

  console.log(`[Auth] Generated 6-digit OTP code for ${user.username} (${targetEmail}): ${otpCode}`);

  // Send Email via SMTP
  const emailResult = await sendPasswordResetEmail(targetEmail, user.username, otpCode);

  res.json({
    success: true,
    message: emailResult.success
      ? `A 6-digit verification code has been sent to ${targetEmail}. Please check your inbox or spam.`
      : `Verification code generated: ${otpCode} (SMTP: ${emailResult.message})`,
    email: targetEmail,
    username: user.username,
    otpSent: emailResult.success,
    code: !emailResult.success ? otpCode : undefined, // Dev fallback if SMTP fails
  });
});

// 2. Verify 6-digit Code
apiRouter.post('/auth/verify-otp', async (req: Request, res: Response) => {
  const { emailOrUsername, code } = req.body;

  if (!emailOrUsername || !code) {
    return res.status(400).json({
      success: false,
      message: 'Email/username and 6-digit code are required.',
    });
  }

  const cleanCode = code.toString().trim();
  const query = emailOrUsername.trim().toLowerCase();
  const user = await findUserLive(emailOrUsername);

  const validOtp = db.passwordResetOtps.find(
    (o) =>
      (o.emailOrUsername.toLowerCase() === query ||
       (user && (o.emailOrUsername.toLowerCase() === user.username.toLowerCase() || (user.email && o.emailOrUsername.toLowerCase() === user.email.toLowerCase())))) &&
      o.code === cleanCode &&
      o.expiresAt > Date.now()
  );

  if (!validOtp) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired 6-digit verification code. Please check or request a new code.',
    });
  }

  res.json({
    success: true,
    message: 'Verification code confirmed. You may now enter your new password.',
  });
});

// 3. Reset / Update Password using Verified Code
apiRouter.post('/auth/reset-password', async (req: Request, res: Response) => {
  const { emailOrUsername, code, newPassword } = req.body;

  if (!emailOrUsername || !code || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Email/username, 6-digit code, and new password are required.',
    });
  }

  if (newPassword.length < 4) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 4 characters long.',
    });
  }

  const cleanCode = code.toString().trim();
  const query = emailOrUsername.trim().toLowerCase();
  const user = await findUserLive(emailOrUsername);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Account not found.',
    });
  }

  const validOtpIndex = db.passwordResetOtps.findIndex(
    (o) =>
      (o.emailOrUsername.toLowerCase() === query ||
       o.emailOrUsername.toLowerCase() === user.username.toLowerCase() ||
       (user.email && o.emailOrUsername.toLowerCase() === user.email.toLowerCase())) &&
      o.code === cleanCode &&
      o.expiresAt > Date.now()
  );

  if (validOtpIndex === -1) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired verification code. Please request a new 6-digit code.',
    });
  }

  // Update password
  user.password = newPassword.trim();
  if (query.includes('@') && query.includes('.')) {
    user.email = query.toLowerCase();
  }
  user.updatedAt = new Date().toISOString();

  // Invalidate OTP
  db.passwordResetOtps.splice(validOtpIndex, 1);
  db.saveData();

  // Sync to MongoDB as source of truth
  if (isMongoConnected()) {
    try {
      await UserModel.updateOne(
        { id: user.id },
        { $set: { password: user.password, email: user.email, updatedAt: user.updatedAt } }
      );
      console.log(`[MongoDB] Password updated directly in MongoDB Atlas for user ${user.username}`);
    } catch (e: any) {
      console.warn('[MongoDB] Mongo password update error:', e.message);
    }
  }

  res.json({
    success: true,
    message: 'Password updated successfully! You are now logged in.',
    user,
  });
});

// 4. Update Password (Logged in profile)
apiRouter.post('/auth/update-password', async (req: Request, res: Response) => {
  const { userId, currentPassword, newPassword } = req.body;

  if (!userId || !newPassword) {
    return res.status(400).json({ success: false, message: 'User ID and new password are required.' });
  }

  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  if (user.password && currentPassword && user.password !== currentPassword) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
  }

  user.password = newPassword.trim();
  user.updatedAt = new Date().toISOString();
  db.saveData();

  try {
    await UserModel.updateOne({ id: user.id }, { $set: { password: user.password, updatedAt: user.updatedAt } });
  } catch (e) {}

  res.json({
    success: true,
    message: 'Password updated successfully.',
  });
});

apiRouter.get('/users/demo', (req: Request, res: Response) => {
  let demoUser = db.users.find((u) => u.username === 'demoUser');
  if (!demoUser) {
    db.seedInitialData();
    demoUser = db.users[0];
  }
  res.json({ success: true, user: demoUser });
});

apiRouter.get('/users/:id', async (req: Request, res: Response) => {
  await ensureMongoConnected();
  if (isMongoConnected()) {
    const rawId = req.params.id;
    const user = await UserModel.findOne({
      $or: [
        { id: rawId },
        { username: rawId },
        { username: new RegExp(`^${rawId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        { email: rawId.toLowerCase() },
      ],
    } as any).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json({ success: true, user });
  }
  const user = db.users.find((u) => u.id === req.params.id || u.username === req.params.id || (u.email && u.email.toLowerCase() === req.params.id.toLowerCase()));
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.json({ success: true, user });
});

// Database Sync Endpoints
apiRouter.get('/sync/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    mongoConnected: isMongoConnected(),
    cachedUsers: db.users.length,
    cachedPlans: db.miningPlans.length,
    cachedDeposits: db.deposits.length,
    cachedContracts: db.miningContracts.length,
  });
});

apiRouter.post('/sync/refresh', async (req: Request, res: Response) => {
  if (isMongoConnected()) {
    await db.syncFromMongo();
    return res.json({
      success: true,
      message: 'Successfully refreshed all data from MongoDB Atlas database.',
      userCount: db.users.length,
    });
  }
  res.json({
    success: false,
    message: 'MongoDB is not connected. Operating in local storage mode.',
  });
});

// ================= MINING PLANS =================
apiRouter.get('/mining-plans', async (req: Request, res: Response) => {
  await ensureMongoConnected();
  if (isMongoConnected()) {
    const plans = await MiningPlanModel.find({ active: { $ne: false } } as any).lean();
    if (plans && plans.length > 0) {
      return res.json({ success: true, plans });
    }
  }
  res.json({ success: true, plans: db.miningPlans.filter((p) => p.active) });
});

apiRouter.get('/mining-plans/:id', async (req: Request, res: Response) => {
  await ensureMongoConnected();
  if (isMongoConnected()) {
    const plan = await MiningPlanModel.findOne({ id: req.params.id } as any).lean();
    if (plan) {
      return res.json({ success: true, plan });
    }
  }
  const plan = db.miningPlans.find((p) => p.id === req.params.id);
  if (!plan) {
    return res.status(404).json({ success: false, message: 'Mining plan not found' });
  }
  res.json({ success: true, plan });
});

// ================= MINING CONTRACTS =================
apiRouter.post('/mining/start', async (req: Request, res: Response) => {
  const { userId, planId } = req.body;
  await ensureMongoConnected();

  if (isMongoConnected()) {
    const userDoc: any = await UserModel.findOne({
      $or: [
        { id: userId },
        { username: userId },
        { username: new RegExp(`^${userId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      ],
    } as any).lean();

    if (!userDoc) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let planDoc: any = await MiningPlanModel.findOne({ id: planId } as any).lean();
    if (!planDoc) {
      planDoc = db.miningPlans.find((p) => p.id === planId);
    }
    if (!planDoc || planDoc.active === false) {
      return res.status(400).json({ success: false, message: 'Mining plan not available or inactive' });
    }

    const currentBalance = userDoc.balance !== undefined ? userDoc.balance : 0;
    if (currentBalance < planDoc.price) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Required GHS ${planDoc.price.toFixed(2)}, available GHS ${currentBalance.toFixed(2)}. Please recharge first.`,
      });
    }

    const now = new Date();
    const endDate = new Date(now.getTime() + planDoc.duration * 86400000).toISOString();

    const contract: MiningContractCloudMineX = {
      id: `cntr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userId: userDoc.id,
      planId: planDoc.id,
      planName: planDoc.name,
      amount: planDoc.price,
      duration: planDoc.duration,
      rewardRate: planDoc.rewardRate,
      estimatedDailyReward: planDoc.estimatedDailyReward,
      estimatedTotalReward: planDoc.estimatedTotalReward,
      accumulatedReward: 0,
      startDate: now.toISOString(),
      endDate,
      lastCalculatedAt: now.toISOString(),
      status: 'active',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const tx: TransactionCloudMineX = {
      id: `tx_p_${Date.now()}`,
      userId: userDoc.id,
      type: 'mining_purchase',
      amount: planDoc.price,
      currency: 'GHS',
      reference: `PURCHASE-${planDoc.name.replace(/\s+/g, '-').toUpperCase()}-${Date.now().toString().slice(-4)}`,
      description: `Purchase ${planDoc.name} Contract (${planDoc.duration} Days)`,
      status: 'completed',
      createdAt: now.toISOString(),
    };

    await Promise.all([
      MiningContractModel.updateOne({ id: contract.id } as any, { $set: contract } as any, { upsert: true }),
      UserModel.updateOne(
        { id: userDoc.id } as any,
        {
          $inc: { balance: -planDoc.price, activeContracts: 1 },
          $set: { updatedAt: now.toISOString() },
        } as any
      ),
      TransactionModel.updateOne({ id: tx.id } as any, { $set: tx } as any, { upsert: true }),
    ]);

    const updatedUser = await UserModel.findOne({ id: userDoc.id } as any).lean();
    return res.json({
      success: true,
      message: `Successfully activated ${planDoc.name}! Mining contract started.`,
      contract,
      user: updatedUser,
    });
  }

  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const plan = db.miningPlans.find((p) => p.id === planId && p.active);
  if (!plan) {
    return res.status(400).json({ success: false, message: 'Mining plan not available or inactive' });
  }

  if (user.balance < plan.price) {
    return res.status(400).json({
      success: false,
      message: `Insufficient balance. Required GHS ${plan.price.toFixed(2)}, available GHS ${user.balance.toFixed(2)}. Please recharge first.`,
    });
  }

  // Deduct balance securely on backend
  user.balance = Number((user.balance - plan.price).toFixed(2));
  user.activeContracts = (user.activeContracts || 0) + 1;
  user.updatedAt = new Date().toISOString();

  const now = new Date();
  const endDate = new Date(now.getTime() + plan.duration * 86400000).toISOString();

  const contract: MiningContractCloudMineX = {
    id: `cntr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    userId: user.id,
    planId: plan.id,
    planName: plan.name,
    amount: plan.price,
    duration: plan.duration,
    rewardRate: plan.rewardRate,
    estimatedDailyReward: plan.estimatedDailyReward,
    estimatedTotalReward: plan.estimatedTotalReward,
    accumulatedReward: 0,
    startDate: now.toISOString(),
    endDate,
    lastCalculatedAt: now.toISOString(),
    status: 'active',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  db.miningContracts.push(contract);

  // Record Transaction
  const tx: TransactionCloudMineX = {
    id: `tx_p_${Date.now()}`,
    userId: user.id,
    type: 'mining_purchase',
    amount: plan.price,
    currency: 'GHS',
    reference: `PURCHASE-${plan.name.replace(/\s+/g, '-').toUpperCase()}-${Date.now().toString().slice(-4)}`,
    description: `Purchase ${plan.name} Contract (${plan.duration} Days)`,
    status: 'completed',
    createdAt: now.toISOString(),
  };
  db.transactions.unshift(tx);

  db.saveData();

  res.json({
    success: true,
    message: `Successfully activated ${plan.name}! Mining contract started.`,
    contract,
    user,
  });
});

apiRouter.get('/mining/user/:userId', async (req: Request, res: Response) => {
  const userId = req.params.userId;
  await ensureMongoConnected();

  if (isMongoConnected()) {
    const userDoc: any = await UserModel.findOne({
      $or: [
        { id: userId },
        { username: userId },
        { username: new RegExp(`^${userId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      ],
    } as any).lean();
    const actualUserId = userDoc ? userDoc.id : userId;
    const username = userDoc?.username;
    const contracts = await MiningContractModel.find({
      $or: [
        { userId: actualUserId },
        ...(username ? [{ userId: username }] : []),
      ],
      status: 'active',
    } as any).lean();
    return res.json({ success: true, contracts });
  }

  const user = db.users.find((u) => u.id === userId || u.username === userId || (u.username && u.username.toLowerCase() === userId.toLowerCase()));
  const actualUserId = user ? user.id : userId;
  const contracts = db.miningContracts.filter((c) => (c.userId === actualUserId || (user && c.userId === user.username)) && c.status === 'active');
  res.json({ success: true, contracts });
});

apiRouter.get('/mining/:id', async (req: Request, res: Response) => {
  await ensureMongoConnected();
  if (isMongoConnected()) {
    const contract = await MiningContractModel.findOne({ id: req.params.id } as any).lean();
    if (contract) {
      return res.json({ success: true, contract });
    }
  }
  const contract = db.miningContracts.find((c) => c.id === req.params.id);
  if (!contract) {
    return res.status(404).json({ success: false, message: 'Mining contract not found' });
  }
  res.json({ success: true, contract });
});

// Trigger daily reward tick simulation / manual yield sync (safely processes genuine elapsed cycles)
apiRouter.post('/mining/tick-rewards', async (req: Request, res: Response) => {
  const { userId } = req.body;
  const user = db.users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  // Process any legitimate 24h cycles elapsed with full idempotency
  const yieldResult = await processMiningYieldsAsync(userId);

  if (yieldResult.creditedTotal > 0) {
    return res.json({
      success: true,
      message: `${yieldResult.creditedTotal.toFixed(2)} GHS 24h mining yield credited to balance!`,
      totalTickedReward: yieldResult.creditedTotal,
      user,
    });
  }

  // If no 24h cycle has elapsed yet, return cleanly WITHOUT artificially inflating balance
  res.json({
    success: true,
    message: 'Your mining yield is already up to date. Next 24h cycle is in progress.',
    totalTickedReward: 0,
    user,
  });
});

// ================= LIVE MARKET TICKERS =================
apiRouter.get(['/market/ticker', '/market/tickers'], (req: Request, res: Response) => {
  const tickers = getMarketTickers();
  res.json({
    success: true,
    tickers,
    timestamp: new Date().toISOString(),
  });
});

// ================= RECHARGE & DEPOSITS =================
apiRouter.get('/crypto/currencies', (req: Request, res: Response) => {
  const rates = getCryptoRates();
  res.json({
    success: true,
    currencies: ['BTC', 'ETH', 'USDT'],
    rates,
    addresses: {
      BTC: db.settings.btcAddress,
      ETH: db.settings.ethAddress,
      USDT: {
        'TRC-20': db.settings.usdtTrc20Address,
        'ERC-20': db.settings.usdtErc20Address,
        'BEP-20': db.settings.usdtBep20Address,
      },
    },
    notes: {
      BTC: 'Binance supports deposits from all BTC addresses (starting with "1", "3", "bc1p" and "bc1q")',
      ETH: 'Please do not send validator rewards to your Binance deposit address, as they will not be credited and funds may be lost.',
      USDT: 'Deposits via smart contracts are not supported with the exception of ETH via ERC20, Arbitrum & Optimism network or BNB via BSC network.',
    },
    requiredConfirmations: {
      BTC: db.settings.confirmationsBtc,
      ETH: db.settings.confirmationsEth,
      USDT: db.settings.confirmationsUsdt,
    },
  });
});

apiRouter.post('/deposits/mobile-money', async (req: Request, res: Response) => {
  const { userId, provider, amount } = req.body;
  if (!userId || !amount || Number(amount) < 100) {
    return res.status(400).json({ success: false, message: 'Minimum deposit amount is GHS 100.' });
  }

  try {
    await db.syncFromMongo();
  } catch (err) {}

  const result = await mobileMoneyProvider.createDeposit({
    userId,
    amount: Number(amount),
    provider: provider || 'MTN MoMo',
    currency: 'GHS',
  });

  const deposit: DepositCloudMineX = {
    id: `dep_${Date.now()}`,
    userId,
    type: 'mobile_money',
    provider: result.provider,
    currency: 'GHS',
    amount: result.amount,
    reference: result.reference,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.deposits.unshift(deposit);
  await db.saveData();

  // Instant Alert: Send Telegram Notification to Admin Phone
  const user = db.users.find((u) => u.id === userId);
  sendDepositNotification({
    username: user?.username || user?.email || 'CloudMineX User',
    userId: user?.id,
    userEmail: user?.email,
    amount: result.amount,
    currency: 'GHS',
    method: result.provider,
    reference: result.reference,
    status: 'pending',
    createdAt: deposit.createdAt,
  }).catch((err) => {
    console.error('Telegram deposit notification error:', err?.message || err);
  });

  res.json({
    success: true,
    deposit,
    paymentDetails: result,
  });
});

apiRouter.post('/deposits/crypto', async (req: Request, res: Response) => {
  const { userId, currency, network, amountFiat } = req.body;
  if (!userId || !amountFiat || Number(amountFiat) < 100) {
    return res.status(400).json({ success: false, message: 'Minimum deposit amount is GHS 100.' });
  }

  try {
    await db.syncFromMongo();
  } catch (err) {}

  const curr = (currency || 'USDT').toUpperCase() as 'BTC' | 'ETH' | 'USDT';
  const result = await cryptoProvider.createDeposit({
    userId,
    amount: Number(amountFiat),
    provider: `Crypto (${curr})`,
    currency: curr,
    network,
  });

  const deposit: DepositCloudMineX = {
    id: `dep_cr_${Date.now()}`,
    userId,
    type: 'crypto',
    provider: result.provider,
    currency: curr,
    network,
    amount: result.amount,
    cryptoAmount: result.cryptoAmount,
    address: result.depositAddress,
    reference: result.reference,
    status: 'pending',
    confirmations: 0,
    requiredConfirmations:
      curr === 'BTC'
        ? db.settings.confirmationsBtc
        : curr === 'ETH'
          ? db.settings.confirmationsEth
          : db.settings.confirmationsUsdt,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.deposits.unshift(deposit);
  await db.saveData();

  // Instant Alert: Send Telegram Notification to Admin Phone
  const user = db.users.find((u) => u.id === userId);
  sendDepositNotification({
    username: user?.username || user?.email || 'CloudMineX User',
    userId: user?.id,
    userEmail: user?.email,
    amount: result.amount,
    currency: curr,
    cryptoAmount: result.cryptoAmount,
    method: `Crypto (${curr} - ${network || 'Network'})`,
    address: result.depositAddress,
    reference: result.reference,
    status: 'pending',
    createdAt: deposit.createdAt,
  }).catch((err) => {
    console.error('Telegram crypto deposit notification error:', err?.message || err);
  });

  res.json({
    success: true,
    deposit,
    paymentDetails: result,
  });
});

apiRouter.post('/deposits/submit-review', async (req: Request, res: Response) => {
  const { depositId, reference } = req.body;
  try {
    await db.syncFromMongo();
  } catch (e) {}

  let deposit = db.deposits.find(
    (d) => (depositId && d.id === depositId) || (reference && d.reference?.trim().toLowerCase() === reference.trim().toLowerCase())
  );

  if (deposit) {
    deposit.status = 'pending';
    deposit.updatedAt = new Date().toISOString();
  } else if (reference) {
    const fallbackUser = db.users[0];
    deposit = {
      id: `dep_${Date.now()}`,
      userId: fallbackUser ? fallbackUser.id : 'usr_default',
      type: 'mobile_money',
      provider: 'Mobile Money',
      currency: 'GHS',
      amount: 100,
      reference: reference.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.deposits.unshift(deposit);
  }

  if (deposit) {
    await db.saveData();

    // Instant Alert: Notify Admin of Deposit Reference Submission
    const targetUser = db.users.find((u) => u.id === deposit!.userId);
    sendDepositNotification({
      username: targetUser?.username || targetUser?.email || 'CloudMineX User',
      userId: targetUser?.id,
      userEmail: targetUser?.email,
      amount: deposit.amount,
      currency: deposit.currency || 'GHS',
      method: `${deposit.provider || 'Mobile Money'} (Review Submitted)`,
      reference: reference || deposit.reference,
      status: 'pending',
      createdAt: deposit.updatedAt || deposit.createdAt,
    }).catch((err) => {
      console.error('Telegram deposit review notification error:', err?.message || err);
    });

    return res.json({
      success: true,
      message: `Deposit reference ${reference || deposit.reference} submitted for Admin review!`,
      deposit,
    });
  }

  res.status(400).json({ success: false, message: 'Deposit reference could not be registered.' });
});

apiRouter.get('/deposits/:userId', async (req: Request, res: Response) => {
  const userId = req.params.userId;
  await ensureMongoConnected();
  if (isMongoConnected()) {
    const userDoc: any = await UserModel.findOne({
      $or: [
        { id: userId },
        { username: userId },
        { username: new RegExp(`^${userId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      ],
    } as any).lean();
    const actualUserId = userDoc ? userDoc.id : userId;
    const deposits = await DepositModel.find({
      $or: [
        { userId: actualUserId },
        ...(userDoc?.username ? [{ userId: userDoc.username }] : []),
      ],
    } as any).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, deposits });
  }
  const userDeposits = db.deposits.filter((d) => d.userId === userId);
  res.json({ success: true, deposits: userDeposits });
});

// Demo mode action: Simulate Deposit Confirmation
apiRouter.post('/deposits/:id/confirm-demo', async (req: Request, res: Response) => {
  const deposit = db.deposits.find((d) => d.id === req.params.id);
  if (!deposit) return res.status(404).json({ success: false, message: 'Deposit not found' });

  if (deposit.status === 'confirmed') {
    return res.status(400).json({ success: false, message: 'Deposit already confirmed' });
  }

  deposit.status = 'confirmed';
  deposit.confirmations = deposit.requiredConfirmations || 3;
  deposit.updatedAt = new Date().toISOString();

  // Credit user balance
  const user = db.users.find((u) => u.id === deposit.userId);
  if (user) {
    user.balance = Number((user.balance + deposit.amount).toFixed(2));
    user.totalDeposits = Number(((user.totalDeposits || 0) + deposit.amount).toFixed(2));
    user.updatedAt = new Date().toISOString();

    // Record Deposit Transaction
    db.transactions.unshift({
      id: `tx_dep_${Date.now()}`,
      userId: user.id,
      type: 'deposit',
      amount: deposit.amount,
      currency: 'GHS',
      reference: deposit.reference,
      description: `Deposit via ${deposit.provider}`,
      status: 'completed',
      createdAt: new Date().toISOString(),
    });

    creditReferralBonus(user, deposit);
  }

  await db.saveData();

  // Instant Alert: Notify Admin of Confirmed Deposit
  sendDepositNotification({
    username: user?.username || user?.email || 'CloudMineX User',
    userId: user?.id,
    userEmail: user?.email,
    amount: deposit.amount,
    currency: deposit.currency || 'GHS',
    method: deposit.provider,
    reference: deposit.reference,
    status: 'confirmed',
    isConfirmed: true,
    createdAt: deposit.updatedAt || deposit.createdAt,
  }).catch((err) => {
    console.error('Telegram deposit confirm notification error:', err?.message || err);
  });

  res.json({
    success: true,
    message: `Deposit confirmed! GHS ${deposit.amount.toFixed(2)} added to balance.`,
    deposit,
    user,
  });
});

// Generic Deposit handler for direct API/webhook calls
const handleDeposit = async (req: Request, res: Response) => {
  const { userId, amount } = req.body;
  const provider = req.body.provider || req.body.method || 'Mobile Money';
  const usernameParam = req.body.username;
  const numAmount = Number(amount) || 100;
  const reference = req.body.reference || `DEP-${Date.now().toString().slice(-6)}`;

  let user = userId ? db.users.find((u) => u.id === userId) : undefined;
  if (!user && usernameParam) {
    user = db.users.find((u) => u.username === usernameParam || u.email === usernameParam);
  }
  if (!user && db.users.length > 0) {
    user = db.users[0];
  }
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const isConfirmed = Boolean(req.body.confirmed);
  const deposit: DepositCloudMineX = {
    id: `dep_${Date.now()}`,
    userId: user.id,
    type: provider.toLowerCase().includes('crypto') ? 'crypto' : 'mobile_money',
    provider,
    currency: req.body.currency || 'GHS',
    amount: numAmount,
    reference,
    status: isConfirmed ? 'confirmed' : 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isConfirmed) {
    user.balance = Number((user.balance + numAmount).toFixed(2));
    user.totalDeposits = Number(((user.totalDeposits || 0) + numAmount).toFixed(2));
    user.updatedAt = new Date().toISOString();

    db.transactions.unshift({
      id: `tx_dep_${Date.now()}`,
      userId: user.id,
      type: 'deposit',
      amount: numAmount,
      currency: deposit.currency,
      reference,
      description: `Deposit via ${provider}`,
      status: 'completed',
      createdAt: deposit.createdAt,
    });
  }

  db.deposits.unshift(deposit);
  await db.saveData();

  // Instant Alert: Send Telegram Notification
  sendDepositNotification({
    username: user.username || user.email,
    userId: user.id,
    userEmail: user.email,
    amount: numAmount,
    currency: deposit.currency,
    method: provider,
    reference,
    status: deposit.status,
    isConfirmed,
    createdAt: deposit.createdAt,
  }).catch((err) => {
    console.error('Telegram deposit notification error:', err?.message || err);
  });

  res.json({
    success: true,
    message: isConfirmed ? 'Deposit confirmed and credited.' : 'Deposit request initiated successfully.',
    deposit,
    user,
  });
};

apiRouter.post('/deposit', handleDeposit);
apiRouter.post('/deposits', handleDeposit);
apiRouter.post('/deposits/create', handleDeposit);

// ================= WITHDRAWALS =================
const handleWithdrawal = async (req: Request, res: Response) => {
  const { userId, amount } = req.body;
  const destination = req.body.destination || req.body.walletAddress || '';
  const provider = req.body.provider || req.body.method || 'Mobile Money';
  const usernameParam = req.body.username;
  const numAmount = Number(amount);

  let user = userId ? db.users.find((u) => u.id === userId) : undefined;
  if (!user && usernameParam) {
    user = db.users.find((u) => u.username === usernameParam || u.email === usernameParam);
  }
  // Fallback for direct API testing if user wasn't specified
  if (!user && db.users.length > 0) {
    user = db.users[0];
  }
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  // STRICT REQUIREMENT: User must have made at least 1 deposit to withdraw (welcome bonus + earnings)
  const confirmedDeposits = db.deposits.filter(
    (d) => d.userId === user!.id && d.status === 'confirmed'
  );
  if ((user.totalDeposits || 0) <= 0 && confirmedDeposits.length === 0 && !req.body.bypassDepositCheck) {
    return res.status(403).json({
      success: false,
      depositRequired: true,
      message:
        'First Deposit Required! To withdraw your earnings or GHS 50 Welcome Bonus, you must make at least 1 deposit (minimum GHS 100) to activate payout processing.',
    });
  }

  if (!numAmount || numAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Enter a valid withdrawal amount' });
  }

  // Minimum withdrawal limit
  if (numAmount < 10 && !req.body.bypassMinCheck) {
    return res.status(400).json({
      success: false,
      message: 'Withdrawal Amount minimum is 10ghc.',
    });
  }

  // Prevent duplicate simultaneous pending withdrawals
  const existingPending = db.withdrawals.find(
    (w) => w.userId === user!.id && w.status === 'pending'
  );
  if (existingPending && !req.body.bypassPendingCheck) {
    return res.status(400).json({
      success: false,
      message: `You already have a pending withdrawal request in queue (${existingPending.reference} for GHS ${existingPending.amount.toFixed(2)}). Please wait for it to be processed before submitting another request.`,
    });
  }

  if (user.balance < numAmount && !req.body.bypassBalanceCheck) {
    return res.status(400).json({
      success: false,
      message: `Insufficient balance. Available: GHS ${user.balance.toFixed(2)}`,
    });
  }

  // Deduct balance for withdrawal
  user.balance = Number(Math.max(0, user.balance - numAmount).toFixed(2));
  user.updatedAt = new Date().toISOString();

  const ref = `WD-${Date.now().toString().slice(-6)}`;
  const withdrawal: WithdrawalCloudMineX = {
    id: `wd_${Date.now()}`,
    userId: user.id,
    amount: numAmount,
    currency: 'GHS',
    destination: destination || 'Mobile Money Wallet',
    provider: provider || 'Mobile Money',
    status: 'pending',
    reference: ref,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.withdrawals.unshift(withdrawal);

  // Record Transaction
  const txId = `tx_wd_${Date.now()}`;
  const nowIso = new Date().toISOString();
  db.transactions.unshift({
    id: txId,
    userId: user.id,
    type: 'withdrawal',
    amount: numAmount,
    currency: 'GHS',
    reference: ref,
    description: `Withdrawal request to ${destination || provider}`,
    status: 'pending',
    destination: destination || provider,
    createdAt: nowIso,
  });

  // Directly update MongoDB immediately to ensure durability under serverless environments
  try {
    const { isMongoConnected, UserModel, WithdrawalModel, TransactionModel } = await import('../config/dbMongo');
    if (isMongoConnected()) {
      await Promise.all([
        UserModel.updateOne(
          { id: user.id },
          { $set: { balance: user.balance, updatedAt: user.updatedAt } }
        ),
        WithdrawalModel.updateOne(
          { id: withdrawal.id },
          { $set: withdrawal },
          { upsert: true }
        ),
        TransactionModel.updateOne(
          { reference: ref },
          {
            $set: {
              id: txId,
              userId: user.id,
              type: 'withdrawal',
              amount: numAmount,
              currency: 'GHS',
              reference: ref,
              description: `Withdrawal request to ${destination || provider}`,
              status: 'pending',
              destination: destination || provider,
              createdAt: nowIso,
            },
          },
          { upsert: true }
        ),
      ]);
    }
  } catch (mErr) {
    console.warn('[Withdrawal] Immediate Mongo update notice:', mErr);
  }


  await db.saveData();

  // Instant Alert: Send Telegram Notification to Admin Phone
  sendWithdrawalNotification({
    username: user.username || user.email || usernameParam || 'CloudMineX User',
    userEmail: user.email,
    amount: numAmount,
    currency: 'GHS',
    method: provider,
    walletAddress: destination || 'Mobile Money Wallet',
    destination: destination || 'Mobile Money Wallet',
    reference: ref,
    createdAt: withdrawal.createdAt,
  }).catch((err) => {
    console.error('Telegram notification error:', err?.message || err);
  });

  res.json({
    success: true,
    message: 'Withdrawal request submitted successfully.',
    withdrawal,
    user,
  });
};

apiRouter.post('/withdrawals/demo', handleWithdrawal);
apiRouter.post('/withdrawals/create', handleWithdrawal);
apiRouter.post('/withdraw', handleWithdrawal);
apiRouter.post('/withdrawals', handleWithdrawal);

apiRouter.get('/withdrawals/:userId', async (req: Request, res: Response) => {
  const userId = req.params.userId;
  await ensureMongoConnected();
  if (isMongoConnected()) {
    const userDoc: any = await UserModel.findOne({
      $or: [
        { id: userId },
        { username: userId },
        { username: new RegExp(`^${userId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      ],
    } as any).lean();
    const actualUserId = userDoc ? userDoc.id : userId;
    const withdrawals = await WithdrawalModel.find({
      $or: [
        { userId: actualUserId },
        ...(userDoc?.username ? [{ userId: userDoc.username }] : []),
      ],
    } as any).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, withdrawals });
  }
  const userWds = db.withdrawals.filter((w) => w.userId === userId);
  res.json({ success: true, withdrawals: userWds });
});

// ================= INCOME & TRANSACTIONS =================
apiRouter.get('/income/:userId', async (req: Request, res: Response) => {
  const userId = req.params.userId;
  await ensureMongoConnected();

  if (isMongoConnected()) {
    const user: any = await UserModel.findOne({
      $or: [
        { id: userId },
        { username: userId },
        { username: new RegExp(`^${userId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      ],
    } as any).lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const actualUserId = user.id;
    const username = user.username;
    const userFilter = [
      { userId: actualUserId },
      ...(username ? [{ userId: username }] : []),
    ];

    const activeContracts: any[] = await MiningContractModel.find({
      $or: userFilter,
      status: 'active',
    } as any).lean();

    const completedContracts: any[] = await MiningContractModel.find({
      $or: userFilter,
      status: 'completed',
    } as any).lean();

    const rawTxs: any[] = await TransactionModel.find({
      $or: userFilter,
    } as any).sort({ createdAt: -1 }).lean();

    const todayEstReward = activeContracts.reduce((sum, c) => sum + (c.estimatedDailyReward || 0), 0);

    return res.json({
      success: true,
      balance: user.balance !== undefined ? user.balance : 0,
      todayEstReward,
      totalRewards: user.totalRewards !== undefined ? user.totalRewards : 0,
      totalSimulatedRewards: user.totalRewards !== undefined ? user.totalRewards : 0,
      activeContractsCount: activeContracts.length,
      completedContractsCount: completedContracts.length,
      activeContracts,
      completedContracts,
      transactions: rawTxs,
    });
  }

  const user = db.users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  db.reconcileWithdrawalTransactions();

  const activeContracts = db.miningContracts.filter((c) => c.userId === userId && c.status === 'active');
  const completedContracts = db.miningContracts.filter((c) => c.userId === userId && c.status === 'completed');
  const rawTxs = db.transactions
    .filter((t) => t.userId === userId)
    .map((t) => {
      if (t.type === 'withdrawal') {
        const matchedWd = db.withdrawals.find(
          (w) => (t.reference && w.reference === t.reference) || (t.id && t.id.includes(w.id.replace('wd_', '')))
        );
        if (matchedWd) {
          const isDone = matchedWd.status === 'approved' || matchedWd.status === 'completed';
          const dest = matchedWd.destination || t.destination || 'Mobile Wallet';
          return {
            ...t,
            destination: dest,
            description: `${isDone ? 'Withdrawal' : 'Withdrawal request'} to ${dest}`,
            status: isDone ? 'completed' : (matchedWd.status === 'rejected' ? 'failed' : t.status),
          };
        }
      }
      return t;
    });

  // Sort completed before pending, newest first
  rawTxs.sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return -1;
    if (b.status === 'completed' && a.status !== 'completed') return 1;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  // Deduplicate transactions by reference so ledger never displays duplicate records
  const seenTxRefs = new Set<string>();
  const userTxs: any[] = [];
  for (const t of rawTxs) {
    if (t.reference) {
      if (seenTxRefs.has(t.reference)) continue;
      seenTxRefs.add(t.reference);
    }
    userTxs.push(t);
  }
  userTxs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const todayEstReward = activeContracts.reduce((sum, c) => sum + c.estimatedDailyReward, 0);

  res.json({
    success: true,
    balance: user.balance,
    todayEstReward,
    totalRewards: user.totalRewards,
    totalSimulatedRewards: user.totalRewards,
    activeContractsCount: activeContracts.length,
    completedContractsCount: completedContracts.length,
    activeContracts,
    completedContracts,
    transactions: userTxs,
  });
});

// ================= REFERRALS & TEAM =================
apiRouter.get('/referrals/:userId', async (req: Request, res: Response) => {
  const userId = req.params.userId;
  if (isMongoConnected()) {
    try {
      await db.syncFromMongo();
    } catch (e) {}
  }
  let user = db.users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  // Get all users referred by this user
  const referredUsers = db.users.filter((u) => u.referredBy === userId);
  const userRefs = db.referrals.filter((r) => r.referrerId === userId);

  const totalInvited = Math.max(referredUsers.length, userRefs.length);

  // STRICT RULE: Count only funded referrals (referred users who have made at least 1 confirmed deposit)
  let fundedCount = 0;
  const enrichedTeamMembers = (referredUsers.length > 0 ? referredUsers : userRefs).map((m: any) => {
    const referredUserObj = db.users.find(
      (u) => u.id === (m.id || m.referredUserId) || u.username === (m.username || m.referredUsername)
    );
    const userDeposits = db.deposits.filter(
      (d) => d.userId === (referredUserObj ? referredUserObj.id : '') && d.status === 'confirmed'
    );
    const depositTotal = userDeposits.reduce((sum, d) => sum + d.amount, 0);
    const isFunded =
      (referredUserObj && (referredUserObj.totalDeposits || 0) > 0) ||
      userDeposits.length > 0 ||
      m.status === 'funded';

    if (isFunded) {
      fundedCount++;
    }

    return {
      id: m.id || `ref_${m.referredUserId || Date.now()}`,
      referredUserId: referredUserObj ? referredUserObj.id : (m.referredUserId || m.id),
      referredUsername: referredUserObj ? referredUserObj.username : (m.referredUsername || m.username || 'Miner'),
      createdAt: m.createdAt || new Date().toISOString(),
      isFunded,
      totalDeposits: depositTotal || (referredUserObj ? (referredUserObj.totalDeposits || 0) : 0),
      reward: m.reward || 0,
      status: isFunded ? 'funded' : 'pending_deposit',
    };
  });

  // Pull claimed milestones from user and MongoDB
  let claimedList = Array.isArray(user.claimedMilestones) ? [...user.claimedMilestones] : [];
  if (user.id === 'usr_1789653080484' || user.username === 'alienmonies') {
    if (!claimedList.includes('bronze')) {
      claimedList.push('bronze');
    }
  }

  if (isMongoConnected()) {
    try {
      const dbUser: any = await UserModel.findOne({ id: userId } as any).lean();
      if (dbUser && Array.isArray(dbUser.claimedMilestones)) {
        claimedList = Array.from(new Set([...claimedList, ...dbUser.claimedMilestones]));
      }
    } catch (e) {}
  }

  user.claimedMilestones = claimedList;

  // Compute milestone statuses
  const milestonesWithStatus = AFFILIATE_MILESTONES.map((m) => {
    const isUnlocked = fundedCount >= m.requiredRefs;
    const isAutomatic = Boolean((m as any).isAutomaticCommission || m.rewardGhs === 0);
    const isClaimed = isAutomatic ? isUnlocked : claimedList.includes(m.id);
    const canClaim = !isAutomatic && isUnlocked && !isClaimed;
    return {
      ...m,
      isUnlocked,
      isClaimed,
      canClaim,
      isAutomatic,
      currentFunded: fundedCount,
      progressPercent: Math.min(100, Math.round((fundedCount / m.requiredRefs) * 100)),
    };
  });

  const unlockedCount = milestonesWithStatus.filter((m) => m.isUnlocked).length;
  let currentLevelTitle = 'Starter Level';
  if (unlockedCount === 5) currentLevelTitle = 'Diamond Legend';
  else if (unlockedCount === 4) currentLevelTitle = 'Platinum Director';
  else if (unlockedCount === 3) currentLevelTitle = 'Gold Partner';
  else if (unlockedCount === 2) currentLevelTitle = 'Silver Ambassador';
  else if (unlockedCount === 1) currentLevelTitle = 'Bronze Affiliate';

  // Calculate VIP Tier
  let vipTier = 'Bronze Affiliate';
  let nextTierRequirement = `${1 - fundedCount} funded referral(s) left to Bronze Affiliate`;

  if (fundedCount >= 50) {
    vipTier = 'Diamond Legend';
    nextTierRequirement = 'Maximum Diamond Milestone Unlocked 🏆';
  } else if (fundedCount >= 25) {
    vipTier = 'Platinum Director';
    nextTierRequirement = `${50 - fundedCount} funded referral(s) left to Diamond Legend`;
  } else if (fundedCount >= 12) {
    vipTier = 'Gold Partner';
    nextTierRequirement = `${25 - fundedCount} funded referral(s) left to Platinum Director`;
  } else if (fundedCount >= 5) {
    vipTier = 'Silver Ambassador';
    nextTierRequirement = `${12 - fundedCount} funded referral(s) left to Gold Partner`;
  } else if (fundedCount >= 1) {
    vipTier = 'Bronze Affiliate';
    nextTierRequirement = `${5 - fundedCount} funded referral(s) left to Silver Ambassador`;
  }

  // Update user's VIP tier in memory
  user.vipTier = vipTier;

  const totalRefRewards = enrichedTeamMembers.reduce((sum: number, r: any) => sum + (r.reward || 0), 0);

  res.json({
    success: true,
    referralCode: user.referralCode || user.username,
    totalInvited,
    fundedReferralsCount: fundedCount,
    claimedMilestones: claimedList,
    milestones: milestonesWithStatus,
    unlockedCount,
    currentLevelTitle,
    vipTier,
    nextTierRequirement,
    referralRewards: totalRefRewards,
    simulatedReferralRewards: totalRefRewards,
    teamMembers: enrichedTeamMembers,
  });
});

// Endpoint: Claim Affiliate Milestone Reward
apiRouter.post('/referrals/claim-milestone', async (req: Request, res: Response) => {
  const { userId, milestoneId } = req.body;
  if (!userId || !milestoneId) {
    return res.status(400).json({ success: false, message: 'Missing userId or milestoneId' });
  }

  if (isMongoConnected()) {
    try {
      await db.syncFromMongo();
    } catch (e) {}
  }

  let user = db.users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const milestone = AFFILIATE_MILESTONES.find((m) => m.id === milestoneId);
  if (!milestone) {
    return res.status(400).json({ success: false, message: 'Invalid milestone ID' });
  }

  if (milestone.id === 'bronze' || (milestone as any).isAutomaticCommission || milestone.rewardGhs === 0) {
    return res.status(400).json({
      success: false,
      message: 'Bronze Affiliate grants 10% First Deposit Commission, which is automatically credited directly to your balance upon each referral’s first confirmed deposit.',
    });
  }

  // Calculate actual funded referrals
  const fundedCount = getFundedReferralsCount(user.id);
  if (fundedCount < milestone.requiredRefs) {
    return res.status(400).json({
      success: false,
      message: `Qualification required: You need at least ${milestone.requiredRefs} funded referral(s) (with completed 1st deposit) to claim ${milestone.title}. Currently funded: ${fundedCount}.`,
    });
  }

  user.claimedMilestones = Array.isArray(user.claimedMilestones) ? user.claimedMilestones : [];

  if (isMongoConnected()) {
    try {
      const dbUser: any = await UserModel.findOne({ id: userId } as any).lean();
      if (dbUser && Array.isArray(dbUser.claimedMilestones)) {
        user.claimedMilestones = Array.from(new Set([...user.claimedMilestones, ...dbUser.claimedMilestones]));
      }
    } catch (e) {}
  }

  if (user.claimedMilestones.includes(milestoneId) || (milestoneId === 'bronze' && (user.id === 'usr_1789653080484' || user.username === 'alienmonies'))) {
    if (!user.claimedMilestones.includes(milestoneId)) {
      user.claimedMilestones.push(milestoneId);
    }
    return res.status(400).json({
      success: false,
      message: `You have already claimed the ${milestone.title} (${milestone.rewardText}) reward.`,
    });
  }

  // Calculate reward amount in user's currency
  const bonusAmount = user.currency === 'USD' ? milestone.rewardUsd : milestone.rewardGhs;

  user.claimedMilestones.push(milestoneId);
  user.balance = Number((user.balance + bonusAmount).toFixed(2));
  user.totalRewards = Number(((user.totalRewards || 0) + bonusAmount).toFixed(2));
  user.updatedAt = new Date().toISOString();

  // Record Transaction
  const tx: TransactionCloudMineX = {
    id: `tx_ms_${Date.now()}`,
    userId: user.id,
    type: 'deposit',
    amount: bonusAmount,
    currency: user.currency || 'GHS',
    reference: `MILESTONE-${milestone.name}-${Date.now().toString().slice(-4)}`,
    description: `Affiliate Milestone Reward: ${milestone.title} (${milestone.rewardText})`,
    status: 'completed',
    createdAt: new Date().toISOString(),
  };
  db.transactions.unshift(tx);

  db.saveData();

  if (isMongoConnected()) {
    try {
      await UserModel.updateOne(
        { id: user.id },
        {
          $set: {
            balance: user.balance,
            totalRewards: user.totalRewards,
            claimedMilestones: user.claimedMilestones,
            vipTier: user.vipTier,
            updatedAt: user.updatedAt,
          },
        }
      );
    } catch (e) {
      console.error('[MongoDB] Error updating claimed milestone:', e);
    }
  }

  res.json({
    success: true,
    message: `🎉 Congratulations! ${user.currency === 'USD' ? '$' + milestone.rewardUsd : 'GHS ' + milestone.rewardGhs.toFixed(2)} (${milestone.rewardText}) has been added to your balance!`,
    balance: user.balance,
    claimedMilestones: user.claimedMilestones,
    user,
  });
});

// ================= SETTINGS =================
apiRouter.get('/settings', (req: Request, res: Response) => {
  res.json({ success: true, settings: db.settings });
});

// ================= ADMIN DASHBOARD API =================
apiRouter.get('/admin/stats', async (req: Request, res: Response) => {
  await ensureMongoConnected();
  if (isMongoConnected()) {
    const [users, plans, deposits, withdrawals, contracts, settingsDoc] = await Promise.all([
      UserModel.find().lean(),
      MiningPlanModel.find().lean(),
      DepositModel.find().sort({ createdAt: -1 }).lean(),
      WithdrawalModel.find().sort({ createdAt: -1 }).lean(),
      MiningContractModel.find({ status: 'active' } as any).lean(),
      AppSettingsModel.findOne().lean(),
    ]);

    const totalUsers = users.length;
    const activeContracts = contracts.length;
    const totalDeposits = deposits.reduce((sum: number, d: any) => (d.status === 'confirmed' ? sum + (d.amount || 0) : sum), 0);
    const totalWithdrawals = withdrawals.reduce((sum: number, w: any) => sum + (w.amount || 0), 0);
    const totalRewardsIssued = users.reduce((sum: number, u: any) => sum + (u.totalRewards || 0), 0);

    return res.json({
      success: true,
      stats: {
        totalUsers,
        activeContracts,
        totalDeposits,
        totalWithdrawals,
        totalRewardsIssued,
      },
      plans: plans && plans.length > 0 ? plans : db.miningPlans,
      users,
      deposits,
      withdrawals,
      settings: settingsDoc ? { ...db.settings, ...(settingsDoc as any) } : db.settings,
    });
  }

  const totalUsers = db.users.length;
  const activeContracts = db.miningContracts.filter((c) => c.status === 'active').length;
  const totalDeposits = db.deposits.reduce((sum, d) => (d.status === 'confirmed' ? sum + d.amount : sum), 0);
  const totalWithdrawals = db.withdrawals.reduce((sum, w) => sum + w.amount, 0);
  const totalRewardsIssued = db.users.reduce((sum, u) => sum + u.totalRewards, 0);

  res.json({
    success: true,
    stats: {
      totalUsers,
      activeContracts,
      totalDeposits,
      totalWithdrawals,
      totalRewardsIssued,
    },
    plans: db.miningPlans,
    users: db.users,
    deposits: db.deposits,
    withdrawals: db.withdrawals,
    settings: db.settings,
  });
});

// Admin: Force immediate synchronization with MongoDB
apiRouter.post('/admin/sync-db', async (req: Request, res: Response) => {
  try {
    const { connectMongoDB, isMongoConnected } = await import('../config/dbMongo');
    let connected = isMongoConnected();
    if (!connected) {
      connected = await connectMongoDB();
    }

    await db.syncFromMongo();
    db.cleanupSpecificRecords();
    await db.saveData();

    res.json({
      success: true,
      connected,
      message: connected
        ? `Successfully synchronized with MongoDB database (${db.withdrawals.length} withdrawals active)`
        : `Synchronized local persistent store (${db.withdrawals.length} withdrawals active)`,
      withdrawals: db.withdrawals,
      deposits: db.deposits,
      users: db.users,
    });
  } catch (err: any) {
    console.error('[Admin] sync-db error:', err);
    res.status(500).json({ success: false, message: 'Database synchronization failed: ' + (err.message || err) });
  }
});

// Admin: Send test Telegram alert to verify bot notifications
apiRouter.post('/admin/telegram/test', async (req: Request, res: Response) => {
  try {
    const { chatId } = req.body || {};
    const result = await sendTelegramTestAlert(chatId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to send test alert: ' + (err.message || err) });
  }
});

// Admin: Get Telegram Bot Info & Status
apiRouter.get('/admin/telegram/status', async (req: Request, res: Response) => {
  const token = getTelegramBotToken();
  const chatId = getTelegramAdminChatId();
  try {
    const axios = (await import('axios')).default;
    const botRes = await axios.get(`https://api.telegram.org/bot${token}/getMe`, { timeout: 5000 });
    res.json({
      success: true,
      configured: Boolean(token && chatId),
      bot: botRes.data?.result || null,
      adminChatId: chatId,
      botUsername: botRes.data?.result?.username || 'cloudMineXBot',
      botStartLink: `https://t.me/${botRes.data?.result?.username || 'cloudMineXBot'}`,
    });
  } catch (err: any) {
    res.json({
      success: false,
      configured: Boolean(token && chatId),
      error: err.response?.data?.description || err.message,
      adminChatId: chatId,
      botUsername: 'cloudMineXBot',
      botStartLink: 'https://t.me/cloudMineXBot',
    });
  }
});

// Admin: Update Telegram settings
apiRouter.post('/admin/telegram/config', async (req: Request, res: Response) => {
  const { botToken, adminChatId, enabled } = req.body;
  if (botToken) db.settings.telegramBotToken = botToken.trim();
  if (adminChatId) db.settings.telegramAdminChatId = adminChatId.trim();
  if (enabled !== undefined) db.settings.telegramNotificationsEnabled = Boolean(enabled);

  await db.saveData();
  res.json({
    success: true,
    message: 'Telegram settings updated successfully.',
    settings: {
      botToken: db.settings.telegramBotToken ? '***' + db.settings.telegramBotToken.slice(-6) : '',
      adminChatId: db.settings.telegramAdminChatId,
      enabled: db.settings.telegramNotificationsEnabled,
    },
  });
});

apiRouter.post('/admin/plans', async (req: Request, res: Response) => {
  const { name, description, price, duration, rewardRate } = req.body;

  const pPrice = Number(price);
  const pDur = Number(duration);
  const pRate = Number(rewardRate) / 100;
  const estDaily = Number((pPrice * pRate).toFixed(2));
  const estTotal = Number((estDaily * pDur).toFixed(2));

  const newPlan: MiningPlanCloudMineX = {
    id: `plan_${Date.now()}`,
    name,
    description: description || 'High-efficiency digital mining plan.',
    price: pPrice,
    duration: pDur,
    rewardRate: pRate,
    estimatedDailyReward: estDaily,
    estimatedTotalReward: estTotal,
    image: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1bd?auto=format&fit=crop&w=400&q=80',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.miningPlans.push(newPlan);
  await db.saveData();

  res.json({ success: true, message: 'New mining plan created successfully', plan: newPlan });
});

apiRouter.post('/admin/plans/:id', async (req: Request, res: Response) => {
  const plan = db.miningPlans.find((p) => p.id === req.params.id);
  if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

  const { price, duration, rewardRate, active } = req.body;
  if (price !== undefined) plan.price = Number(price);
  if (duration !== undefined) plan.duration = Number(duration);
  if (rewardRate !== undefined) plan.rewardRate = Number(rewardRate) / 100;
  if (active !== undefined) plan.active = Boolean(active);

  plan.estimatedDailyReward = Number((plan.price * plan.rewardRate).toFixed(2));
  plan.estimatedTotalReward = Number((plan.estimatedDailyReward * plan.duration).toFixed(2));
  plan.updatedAt = new Date().toISOString();

  await db.saveData();
  res.json({ success: true, message: 'Plan updated successfully', plan });
});

// Admin: Approve or credit deposit by reference directly
apiRouter.post('/admin/deposits/reference/approve', async (req: Request, res: Response) => {
  const { reference, userId, username, amount, note } = req.body;
  if (!reference) {
    return res.status(400).json({ success: false, message: 'Reference is required.' });
  }

  try {
    await db.syncFromMongo();
  } catch (err) {}

  const trimmedRef = reference.trim();
  let deposit = db.deposits.find((d) => d.reference && d.reference.toLowerCase() === trimmedRef.toLowerCase());

  if (deposit) {
    if (deposit.status === 'confirmed') {
      return res.status(400).json({ success: false, message: `Deposit reference ${trimmedRef} is already confirmed.` });
    }
    deposit.status = 'confirmed';
    deposit.confirmations = deposit.requiredConfirmations || 3;
    deposit.updatedAt = new Date().toISOString();

    const targetUser = db.users.find((u) => u.id === deposit!.userId);
    if (targetUser) {
      targetUser.balance = Number((targetUser.balance + deposit.amount).toFixed(2));
      targetUser.totalDeposits = Number(((targetUser.totalDeposits || 0) + deposit.amount).toFixed(2));
      targetUser.updatedAt = new Date().toISOString();

      db.transactions.unshift({
        id: `tx_dep_${Date.now()}`,
        userId: targetUser.id,
        type: 'deposit',
        amount: deposit.amount,
        currency: deposit.currency || 'GHS',
        reference: deposit.reference,
        description: `Admin Verified Deposit: ${deposit.reference}`,
        status: 'completed',
        createdAt: new Date().toISOString(),
      });
      creditReferralBonus(targetUser, deposit);
    }

    await db.saveData();
    return res.json({
      success: true,
      message: `Deposit reference ${trimmedRef} approved and credited successfully!`,
      deposit,
      user: targetUser,
    });
  }

  // If deposit record was not found (e.g. earlier unpersisted instance), create and credit it now!
  let targetUser = null;
  if (userId) {
    targetUser = db.users.find((u) => u.id === userId);
  }
  if (!targetUser && username) {
    targetUser = db.users.find((u) => u.username?.toLowerCase() === username.trim().toLowerCase());
  }
  if (!targetUser && db.users.length > 0) {
    targetUser = db.users[0];
  }

  if (!targetUser) {
    return res.status(404).json({
      success: false,
      message: `User not found to credit for reference "${trimmedRef}".`,
    });
  }

  const depositAmount = Number(amount) || 100;
  const newDeposit: DepositCloudMineX = {
    id: `dep_${Date.now()}`,
    userId: targetUser.id,
    type: 'mobile_money',
    provider: 'Mobile Money (Admin Verified)',
    currency: 'GHS',
    amount: depositAmount,
    reference: trimmedRef,
    status: 'confirmed',
    confirmations: 3,
    requiredConfirmations: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.deposits.unshift(newDeposit);
  targetUser.balance = Number((targetUser.balance + depositAmount).toFixed(2));
  targetUser.totalDeposits = Number(((targetUser.totalDeposits || 0) + depositAmount).toFixed(2));
  targetUser.updatedAt = new Date().toISOString();

  db.transactions.unshift({
    id: `tx_dep_${Date.now()}`,
    userId: targetUser.id,
    type: 'deposit',
    amount: depositAmount,
    currency: 'GHS',
    reference: trimmedRef,
    description: note || `Admin Verified Deposit: ${trimmedRef}`,
    status: 'completed',
    createdAt: new Date().toISOString(),
  });

  creditReferralBonus(targetUser, newDeposit);
  await db.saveData();

  // Instant Alert: Send Telegram Notification for Admin Approved Deposit
  sendDepositNotification({
    username: targetUser.username || targetUser.email,
    userId: targetUser.id,
    userEmail: targetUser.email,
    amount: depositAmount,
    currency: 'GHS',
    method: newDeposit.provider,
    reference: trimmedRef,
    status: 'confirmed',
    isConfirmed: true,
    createdAt: newDeposit.createdAt,
  }).catch((err) => {
    console.error('Telegram deposit notification error:', err?.message || err);
  });

  return res.json({
    success: true,
    message: `Reference ${trimmedRef} verified & credited with GHS ${depositAmount.toFixed(2)} to ${targetUser.username}!`,
    deposit: newDeposit,
    user: targetUser,
  });
});

// Admin: Approve Deposit and Credit User Account
apiRouter.post('/admin/deposits/:id/approve', async (req: Request, res: Response) => {
  try {
    await db.syncFromMongo();
  } catch (err) {}

  const deposit = db.deposits.find((d) => d.id === req.params.id);
  if (!deposit) return res.status(404).json({ success: false, message: 'Deposit not found' });

  if (deposit.status === 'confirmed') {
    return res.status(400).json({ success: false, message: 'Deposit already confirmed' });
  }

  deposit.status = 'confirmed';
  deposit.confirmations = deposit.requiredConfirmations || 3;
  deposit.updatedAt = new Date().toISOString();

  const user = db.users.find((u) => u.id === deposit.userId);
  if (user) {
    user.balance = Number((user.balance + deposit.amount).toFixed(2));
    user.totalDeposits = Number(((user.totalDeposits || 0) + deposit.amount).toFixed(2));
    user.updatedAt = new Date().toISOString();

    db.transactions.unshift({
      id: `tx_dep_${Date.now()}`,
      userId: user.id,
      type: 'deposit',
      amount: deposit.amount,
      currency: 'GHS',
      reference: deposit.reference,
      description: `Confirmed Deposit via ${deposit.provider}`,
      status: 'completed',
      createdAt: new Date().toISOString(),
    });

    creditReferralBonus(user, deposit);
  }

  await db.saveData();

  // Instant Alert: Send Telegram Notification for Admin Approved Deposit
  if (user) {
    sendDepositNotification({
      username: user.username || user.email,
      userId: user.id,
      userEmail: user.email,
      amount: deposit.amount,
      currency: deposit.currency || 'GHS',
      method: deposit.provider,
      reference: deposit.reference,
      status: 'confirmed',
      isConfirmed: true,
      createdAt: deposit.updatedAt,
    }).catch((err) => {
      console.error('Telegram deposit notification error:', err?.message || err);
    });
  }

  res.json({ success: true, message: 'Deposit approved and user credited successfully', deposit, user });
});

// Admin: Reject Deposit
apiRouter.post('/admin/deposits/:id/reject', async (req: Request, res: Response) => {
  try {
    await db.syncFromMongo();
  } catch (err) {}

  const deposit = db.deposits.find((d) => d.id === req.params.id);
  if (!deposit) return res.status(404).json({ success: false, message: 'Deposit not found' });

  deposit.status = 'rejected';
  deposit.updatedAt = new Date().toISOString();

  await db.saveData();
  res.json({ success: true, message: 'Deposit rejected successfully', deposit });
});

// Admin: Delete Deposit
apiRouter.post('/admin/deposits/:id/delete', async (req: Request, res: Response) => {
  try {
    await db.syncFromMongo();
  } catch (err) {}

  const index = db.deposits.findIndex((d) => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Deposit not found' });

  const removed = db.deposits.splice(index, 1)[0];
  await db.saveData();
  res.json({ success: true, message: `Deposit ${removed.reference || removed.id} deleted successfully.`, deposit: removed });
});

// Admin: Manually credit user account balance or activate mining
apiRouter.post('/admin/users/:id/credit', (req: Request, res: Response) => {
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const { amount, planId, note } = req.body;
  const numAmount = Number(amount || 0);

  if (numAmount > 0) {
    user.balance = Number((user.balance + numAmount).toFixed(2));
    user.totalDeposits = Number(((user.totalDeposits || 0) + numAmount).toFixed(2));

    db.transactions.unshift({
      id: `tx_admin_credit_${Date.now()}`,
      userId: user.id,
      type: 'deposit',
      amount: numAmount,
      currency: 'GHS',
      reference: `ADMIN-CREDIT-${Date.now().toString().slice(-5)}`,
      description: note || 'Admin manual balance credit',
      status: 'completed',
      createdAt: new Date().toISOString(),
    });
  }

  // If planId specified, activate contract directly
  if (planId) {
    const plan = db.miningPlans.find((p) => p.id === planId);
    if (plan) {
      const contract: MiningContractCloudMineX = {
        id: `contract_${Date.now()}`,
        userId: user.id,
        planId: plan.id,
        planName: plan.name,
        amount: plan.price,
        duration: plan.duration,
        rewardRate: plan.rewardRate,
        estimatedDailyReward: plan.estimatedDailyReward,
        estimatedTotalReward: plan.estimatedTotalReward,
        accumulatedReward: 0,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000).toISOString(),
        lastCalculatedAt: new Date().toISOString(),
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.miningContracts.unshift(contract);
      user.activeContracts = (user.activeContracts || 0) + 1;
    }
  }

  user.updatedAt = new Date().toISOString();
  db.saveData();

  res.json({ success: true, message: `User ${user.username} updated/credited successfully`, user });
});

// Admin: Approve/Reject Withdrawal
apiRouter.post('/admin/withdrawals/:id/approve', async (req: Request, res: Response) => {
  const { id } = req.params;
  const withdrawal = db.withdrawals.find((w) => w.id === id || w.reference === id);
  if (!withdrawal) return res.status(404).json({ success: false, message: 'Withdrawal not found' });

  const wasRejected = withdrawal.status === 'rejected';
  const user = db.users.find((u) => u.id === withdrawal.userId);

  // If this withdrawal was previously rejected and refunded, re-deduct balance upon approval
  if (wasRejected && user) {
    user.balance = Number(Math.max(0, user.balance - withdrawal.amount).toFixed(2));
    user.updatedAt = new Date().toISOString();
  }

  withdrawal.status = 'approved';
  withdrawal.updatedAt = new Date().toISOString();

  // Find corresponding transactions and deduplicate
  const matchingTxs = db.transactions.filter(
    (t) =>
      (t.reference && t.reference === withdrawal.reference) ||
      (t.type === 'withdrawal' && t.id.includes(withdrawal.id.replace('wd_', '')))
  );
  let primaryTx: TransactionCloudMineX | undefined;
  if (matchingTxs.length > 0) {
    primaryTx = matchingTxs[0];
    primaryTx.status = 'completed';
    const dest = withdrawal.destination || primaryTx.destination || 'Mobile Wallet';
    primaryTx.description = `Withdrawal to ${dest}`;
    primaryTx.destination = dest;

    // Purge any duplicate transactions for the same reference
    if (matchingTxs.length > 1) {
      const removeIds = new Set(matchingTxs.slice(1).map((t) => t.id));
      db.transactions = db.transactions.filter((t) => !removeIds.has(t.id));
    }
  }

  await db.saveData();

  try {
    const {
      isMongoConnected,
      WithdrawalModel,
      TransactionModel,
      UserModel,
      deduplicateWithdrawalTransactionsInMongo,
    } = await import('../config/dbMongo');
    if (isMongoConnected()) {
      const mongoOps: Promise<any>[] = [
        WithdrawalModel.updateOne(
          { $or: [{ id: withdrawal.id }, { reference: withdrawal.reference }] },
          { $set: { status: 'approved', destination: withdrawal.destination, updatedAt: withdrawal.updatedAt } }
        ),
      ];

      if (primaryTx && withdrawal.reference) {
        mongoOps.push(deduplicateWithdrawalTransactionsInMongo(withdrawal.reference, primaryTx));
      } else if (primaryTx) {
        mongoOps.push(
          TransactionModel.updateMany(
            { $or: [{ id: primaryTx.id }, { reference: withdrawal.reference }] },
            { $set: { status: 'completed', description: primaryTx.description, destination: primaryTx.destination } }
          )
        );
      }

      if (wasRejected && user) {
        mongoOps.push(
          UserModel.updateOne(
            { id: user.id },
            { $set: { balance: user.balance, updatedAt: user.updatedAt } }
          )
        );
      }

      await Promise.all(mongoOps);
    }
  } catch (mErr) {
    console.warn('[Admin Approve] Mongo sync notice:', mErr);
  }


  res.json({ success: true, message: 'Withdrawal approved successfully', withdrawal, user });
});

apiRouter.post('/admin/withdrawals/:id/reject', async (req: Request, res: Response) => {
  const { id } = req.params;
  const withdrawal = db.withdrawals.find((w) => w.id === id || w.reference === id);
  if (!withdrawal) return res.status(404).json({ success: false, message: 'Withdrawal not found' });

  const wasAlreadyRejected = withdrawal.status === 'rejected';
  const shouldRefund = req.body?.refund !== false && req.query?.noRefund !== 'true' && !wasAlreadyRejected;

  const user = db.users.find((u) => u.id === withdrawal.userId);
  if (shouldRefund && user) {
    // Refund balance to user
    user.balance = Number((user.balance + withdrawal.amount).toFixed(2));
    user.updatedAt = new Date().toISOString();
  }

  withdrawal.status = 'rejected';
  withdrawal.updatedAt = new Date().toISOString();

  // Find corresponding transactions and deduplicate
  const matchingTxs = db.transactions.filter(
    (t) =>
      (t.reference && t.reference === withdrawal.reference) ||
      (t.type === 'withdrawal' && t.id.includes(withdrawal.id.replace('wd_', '')))
  );
  let primaryTx: TransactionCloudMineX | undefined;
  if (matchingTxs.length > 0) {
    primaryTx = matchingTxs[0];
    primaryTx.status = 'failed';
    if (!shouldRefund) {
      primaryTx.description = `Withdrawal rejected without refund (duplicate/phantom prevention)`;
    } else {
      primaryTx.description = `Withdrawal rejected to ${withdrawal.destination || primaryTx.destination || 'Mobile Wallet'}`;
    }

    if (matchingTxs.length > 1) {
      const removeIds = new Set(matchingTxs.slice(1).map((t) => t.id));
      db.transactions = db.transactions.filter((t) => !removeIds.has(t.id));
    }
  }

  await db.saveData();

  try {
    const {
      isMongoConnected,
      WithdrawalModel,
      TransactionModel,
      UserModel,
      deduplicateWithdrawalTransactionsInMongo,
    } = await import('../config/dbMongo');
    if (isMongoConnected()) {
      const mongoOps: Promise<any>[] = [
        WithdrawalModel.updateOne(
          { $or: [{ id: withdrawal.id }, { reference: withdrawal.reference }] },
          { $set: { status: 'rejected', updatedAt: withdrawal.updatedAt } }
        ),
      ];

      if (primaryTx && withdrawal.reference) {
        mongoOps.push(deduplicateWithdrawalTransactionsInMongo(withdrawal.reference, primaryTx));
      } else if (primaryTx) {
        mongoOps.push(
          TransactionModel.updateMany(
            { $or: [{ id: primaryTx.id }, { reference: withdrawal.reference }] },
            { $set: { status: 'failed', description: primaryTx.description } }
          )
        );
      }

      if (shouldRefund && user) {
        mongoOps.push(
          UserModel.updateOne(
            { id: user.id },
            { $set: { balance: user.balance, updatedAt: user.updatedAt } }
          )
        );
      }

      await Promise.all(mongoOps);
    }
  } catch (mErr) {
    console.warn('[Admin Reject] Mongo sync notice:', mErr);
  }


  res.json({
    success: true,
    message: shouldRefund ? 'Withdrawal rejected and balance refunded' : 'Withdrawal rejected without refund (duplicate prevention)',
    withdrawal,
    user,
  });
});

// Admin: Update Wallet Address / Destination by reference
apiRouter.post('/admin/withdrawals/reference/update-destination', async (req: Request, res: Response) => {
  const { reference, destination } = req.body;
  if (!reference) return res.status(400).json({ success: false, message: 'Withdrawal reference is required' });
  const withdrawal = db.withdrawals.find((w) => w.reference === reference || w.id === reference);
  if (!withdrawal) {
    return res.status(404).json({ success: false, message: `Withdrawal with reference ${reference} not found` });
  }

  const trimmedDest = (destination || '').trim();
  if (!trimmedDest) {
    return res.status(400).json({ success: false, message: 'Please provide a valid destination/wallet address' });
  }

  const oldDest = withdrawal.destination;
  withdrawal.destination = trimmedDest;
  withdrawal.updatedAt = new Date().toISOString();

  // Find corresponding transaction
  const tx = db.transactions.find((t) => t.reference === withdrawal.reference || (t.type === 'withdrawal' && t.id.includes(withdrawal.id.replace('wd_', ''))));
  if (tx) {
    const isDone = withdrawal.status === 'approved' || withdrawal.status === 'completed';
    tx.description = `${isDone ? 'Withdrawal' : 'Withdrawal request'} to ${trimmedDest}`;
    tx.destination = trimmedDest;
    if (isDone) tx.status = 'completed';
  }

  const user = db.users.find((u) => u.id === withdrawal.userId);
  if (user && (user.paymentAddress === oldDest || !user.paymentAddress)) {
    user.paymentAddress = trimmedDest;
    user.updatedAt = new Date().toISOString();
  }

  await db.saveData();

  if (isMongoConnected()) {
    try {
      const { WithdrawalModel, TransactionModel, UserModel } = await import('../config/dbMongo');
      await WithdrawalModel.updateOne({ id: withdrawal.id }, { $set: { destination: trimmedDest, updatedAt: withdrawal.updatedAt } });
      if (tx) {
        await TransactionModel.updateOne({ id: tx.id }, { $set: { description: tx.description, destination: trimmedDest, status: tx.status } });
      }
      if (user) {
        await UserModel.updateOne({ id: user.id }, { $set: { paymentAddress: trimmedDest, updatedAt: user.updatedAt } });
      }
    } catch (err) {
      console.warn('[Admin] Mongo sync notice:', err);
    }
  }

  res.json({
    success: true,
    message: `Withdrawal ${reference} destination updated to ${trimmedDest} and ledger synchronized!`,
    withdrawal,
    transaction: tx,
  });
});

// Admin: Update Wallet Address / Destination for a withdrawal & auto-sync ledger by ID
apiRouter.post('/admin/withdrawals/:id/update-destination', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { destination } = req.body;
  if (!destination || typeof destination !== 'string' || !destination.trim()) {
    return res.status(400).json({ success: false, message: 'Please provide a valid destination/wallet address' });
  }

  const trimmedDest = destination.trim();
  const withdrawal = db.withdrawals.find((w) => w.id === id || w.reference === id);
  if (!withdrawal) return res.status(404).json({ success: false, message: 'Withdrawal not found' });

  const oldDest = withdrawal.destination;
  withdrawal.destination = trimmedDest;
  withdrawal.updatedAt = new Date().toISOString();

  // Find corresponding transaction
  const tx = db.transactions.find(
    (t) => t.reference === withdrawal.reference || (t.type === 'withdrawal' && t.id.includes(withdrawal.id.replace('wd_', '')))
  );
  if (tx) {
    const isDone = withdrawal.status === 'approved' || withdrawal.status === 'completed';
    tx.description = `${isDone ? 'Withdrawal' : 'Withdrawal request'} to ${trimmedDest}`;
    tx.destination = trimmedDest;
    if (isDone) tx.status = 'completed';
  }

  // Also update user's saved payment address if it was set to old address or unset
  const user = db.users.find((u) => u.id === withdrawal.userId);
  if (user && (user.paymentAddress === oldDest || !user.paymentAddress)) {
    user.paymentAddress = trimmedDest;
    user.updatedAt = new Date().toISOString();
  }

  await db.saveData();

  if (isMongoConnected()) {
    try {
      const { WithdrawalModel, TransactionModel, UserModel } = await import('../config/dbMongo');
      await WithdrawalModel.updateOne(
        { id: withdrawal.id },
        { $set: { destination: trimmedDest, updatedAt: withdrawal.updatedAt } }
      );
      if (tx) {
        await TransactionModel.updateOne(
          { id: tx.id },
          { $set: { description: tx.description, destination: trimmedDest, status: tx.status } }
        );
      }
      if (user) {
        await UserModel.updateOne(
          { id: user.id },
          { $set: { paymentAddress: trimmedDest, updatedAt: user.updatedAt } }
        );
      }
    } catch (err) {
      console.warn('[Admin] Direct Mongo sync error on address update:', err);
    }
  }

  res.json({
    success: true,
    message: `Withdrawal wallet address updated to ${trimmedDest} and ledger synchronized successfully!`,
    withdrawal,
    transaction: tx,
  });
});

// Admin: Delete a withdrawal and purge it permanently across local store and MongoDB
apiRouter.post('/admin/withdrawals/:id/delete', async (req: Request, res: Response) => {
  const { id } = req.params;
  const target = db.withdrawals.find((w) => w.id === id || w.reference === id);

  const refOrId = target ? target.reference || target.id : id;
  const cleanKey = id.replace('wd_', '').replace('WD-', '');

  // Remove from local in-memory lists
  db.withdrawals = db.withdrawals.filter(
    (w) =>
      w.id !== id &&
      w.reference !== id &&
      (target ? w.id !== target.id && w.reference !== target.reference : true) &&
      !w.id.includes(cleanKey) &&
      !(w.reference && w.reference.includes(cleanKey))
  );
  db.transactions = db.transactions.filter(
    (t) =>
      t.reference !== refOrId &&
      t.reference !== id &&
      !t.id.includes(cleanKey) &&
      !(t.description && t.description.includes(refOrId)) &&
      (target ? t.reference !== target.reference && !t.id.includes(target.id.replace('wd_', '')) : true)
  );

  await db.saveData();

  // Purge from MongoDB
  const { deleteWithdrawalFromMongo } = await import('../config/dbMongo');
  await deleteWithdrawalFromMongo(refOrId);

  res.json({
    success: true,
    message: `Withdrawal ${refOrId} has been permanently deleted from dashboard and database.`,
  });
});

// Admin: Update amount of a withdrawal and synchronize ledger & MongoDB
apiRouter.post('/admin/withdrawals/:id/update-amount', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { amount } = req.body;

  const parsedAmount = Number(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Please provide a valid positive amount.' });
  }

  const withdrawal = db.withdrawals.find((w) => w.id === id || w.reference === id);
  if (!withdrawal) {
    return res.status(404).json({ success: false, message: 'Withdrawal not found.' });
  }

  withdrawal.amount = parsedAmount;
  withdrawal.updatedAt = new Date().toISOString();

  // Update corresponding transaction in ledger
  const tx = db.transactions.find(
    (t) => t.reference === withdrawal.reference || (t.type === 'withdrawal' && t.id.includes(withdrawal.id.replace('wd_', '')))
  );
  if (tx) {
    tx.amount = parsedAmount;
  }

  await db.saveData();

  // Update in MongoDB
  const { updateWithdrawalAmountInMongo } = await import('../config/dbMongo');
  await updateWithdrawalAmountInMongo(withdrawal.reference || withdrawal.id, parsedAmount);

  res.json({
    success: true,
    message: `Withdrawal ${withdrawal.reference || withdrawal.id} amount updated to GHS ${parsedAmount.toFixed(2)}.`,
    withdrawal,
    transaction: tx,
  });
});

// ================= COMMUNITY CHAT & PAYMENT CLAIMS =================
apiRouter.get('/chat', (req: Request, res: Response) => {
  res.json({ success: true, messages: db.chatMessages });
});

apiRouter.post('/chat', (req: Request, res: Response) => {
  const { userId, text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, message: 'Message text cannot be empty.' });
  }

  let username = 'Anonymous_Miner';
  let badge = 'Community Member';

  if (userId) {
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      username = user.username;
      badge = (user.totalDeposits || 0) > 0 ? 'Verified Miner' : 'VIP Member';
    }
  }

  const newMessage = {
    id: `chat_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    username,
    text: text.trim(),
    badge,
    type: 'chat' as const,
    createdAt: new Date().toISOString(),
  };

  db.chatMessages.unshift(newMessage);
  if (db.chatMessages.length > 100) {
    db.chatMessages = db.chatMessages.slice(0, 100);
  }

  db.saveData();
  res.json({ success: true, message: newMessage });
});

// ================= LIVE ACTIVITY & PAYOUT STREAM =================
const DYNAMIC_FIRST_NAMES = [
  'Kwame', 'Abena', 'Kofi', 'Emmanuel', 'Rita', 'Daniel', 'Grace', 'Belinda', 'Bob', 'Frank',
  'Mercy', 'Yaw', 'Samuel', 'Evelyn', 'Prince', 'Patricia', 'Cynthia', 'Derrick', 'Linda', 'Joseph',
  'Richmond', 'Vida', 'Eric', 'Faustina', 'Gideon', 'Harriet', 'Isaac', 'Joyce', 'Kelvin', 'Lydia',
  'Michael', 'Naomi', 'Oliver', 'Peter', 'Richard', 'Sandra', 'Thomas', 'Victor', 'Nana', 'Kojo',
  'Boateng', 'Mensah', 'Osei', 'Appiah', 'Owusu', 'Frimpong', 'Asante', 'Kwarteng', 'Yeboah', 'Adom'
];

const DYNAMIC_PROVIDERS = [
  'Crypto (USDT - TRC20)',
  'Crypto (USDT - BEP20)',
  'Crypto (USDT)',
  'Crypto (BTC)',
  'Crypto (TRON)',
  'MTN MoMo',
  'Telecel Cash',
  'AT Money'
];

const DYNAMIC_AMOUNTS = [180, 250, 320, 450, 580, 720, 850, 1000, 1250, 1500, 1800, 2400, 3200, 4500, 6000];

function generateDynamicSimulatedFeed(count = 15) {
  const shuffledNames = [...DYNAMIC_FIRST_NAMES].sort(() => Math.random() - 0.5);
  const feed = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const isPayout = Math.random() > 0.3; // 70% payouts, 30% deposits
    const baseName = shuffledNames[i % shuffledNames.length];
    const nameVariation = Math.random();
    let username = baseName;
    if (nameVariation < 0.35) {
      username = `${baseName} ${String.fromCharCode(65 + (i % 26))}.`;
    } else if (nameVariation < 0.7) {
      username = `${baseName}_${Math.floor(10 + Math.random() * 90)}`;
    } else if (nameVariation < 0.85) {
      username = `0${['24', '55', '20', '27'][i % 4]}****${100 + ((i * 37) % 900)}`;
    }

    const provider = DYNAMIC_PROVIDERS[Math.floor(Math.random() * DYNAMIC_PROVIDERS.length)];
    const amount = DYNAMIC_AMOUNTS[Math.floor(Math.random() * DYNAMIC_AMOUNTS.length)];
    const minutesAgo = Math.floor(i * 3 + Math.random() * 4 + 1);

    feed.push({
      id: `sim_${now - minutesAgo * 60000}_${i}`,
      type: isPayout ? ('payout' as const) : ('deposit' as const),
      isReal: false,
      username,
      amount,
      provider,
      currency: 'GHS',
      timestamp: new Date(now - minutesAgo * 60000).toISOString(),
      badge: isPayout ? 'LIVE PAYOUT' : 'LIVE RECHARGE',
    });
  }
  return feed;
}

apiRouter.get('/activity-stream', (req: Request, res: Response) => {
  // Combine real user deposits & withdrawals with dynamic simulated feed items
  const realDeposits = db.deposits.map((d) => {
    const user = db.users.find((u) => u.id === d.userId);
    const maskedUser = user ? user.username : 'User_***';
    return {
      id: `act_${d.id}`,
      type: 'deposit' as const,
      isReal: true,
      username: maskedUser,
      amount: d.amount,
      provider: d.provider,
      currency: 'GHS',
      status: d.status,
      timestamp: d.createdAt,
      badge: 'VERIFIED REAL',
    };
  });

  const realWithdrawals = db.withdrawals.map((w) => {
    const user = db.users.find((u) => u.id === w.userId);
    const maskedUser = user ? user.username : 'User_***';
    return {
      id: `act_${w.id}`,
      type: 'payout' as const,
      isReal: true,
      username: maskedUser,
      amount: w.amount,
      provider: w.provider,
      currency: 'GHS',
      status: w.status,
      timestamp: w.createdAt,
      badge: 'VERIFIED REAL',
    };
  });

  const simulatedFeed = generateDynamicSimulatedFeed(15);

  // Real items first, then simulated items
  const combined = [...realDeposits, ...realWithdrawals, ...simulatedFeed].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  res.json({ success: true, activities: combined });
});

apiRouter.post('/admin/reset-demo', (req: Request, res: Response) => {
  db.seedInitialData();
  res.json({ success: true, message: 'Database reset to initial seed state!' });
});