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
import { calculateEstimatedReward, processMiningYields } from '../services/rewardEngine';
import { getCryptoRates, convertFiatToCrypto } from '../services/cryptoPriceService';
import { mobileMoneyProvider } from '../services/payment/mobileMoneyProvider';
import { cryptoProvider } from '../services/payment/cryptoProvider';
import { sendPasswordResetEmail } from '../services/emailService';
import { UserModel, isMongoConnected } from '../config/dbMongo';

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
    rewardText: '$10 Cash Bonus',
    rewardUsd: 10,
    rewardGhs: 150,
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
    rewardText: '$50 Instant Bonus + 1% Extra Comm',
    rewardUsd: 50,
    rewardGhs: 750,
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
    rewardText: '$250 VIP Partner Reward',
    rewardUsd: 250,
    rewardGhs: 3750,
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
    rewardText: '$1,000 Executive Cash Pool',
    rewardUsd: 1000,
    rewardGhs: 15000,
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
    rewardText: '$3,000 Global Profit Share',
    rewardUsd: 3000,
    rewardGhs: 45000,
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
  if (isMongoConnected()) {
    try {
      await db.syncFromMongo();
    } catch (e) {}
  }
  processMiningYields(req.params.id);
  const user = db.users.find((u) => u.id === req.params.id);
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
apiRouter.get('/mining-plans', (req: Request, res: Response) => {
  res.json({ success: true, plans: db.miningPlans.filter((p) => p.active) });
});

apiRouter.get('/mining-plans/:id', (req: Request, res: Response) => {
  const plan = db.miningPlans.find((p) => p.id === req.params.id);
  if (!plan) {
    return res.status(404).json({ success: false, message: 'Mining plan not found' });
  }
  res.json({ success: true, plan });
});

// ================= MINING CONTRACTS =================
apiRouter.post('/mining/start', (req: Request, res: Response) => {
  const { userId, planId } = req.body;

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
  if (isMongoConnected()) {
    try {
      await db.syncFromMongo();
    } catch (e) {}
  }
  processMiningYields(req.params.userId);
  const contracts = db.miningContracts.filter((c) => c.userId === req.params.userId);
  res.json({ success: true, contracts });
});

apiRouter.get('/mining/:id', (req: Request, res: Response) => {
  const contract = db.miningContracts.find((c) => c.id === req.params.id);
  if (!contract) {
    return res.status(404).json({ success: false, message: 'Mining contract not found' });
  }
  res.json({ success: true, contract });
});

// Trigger daily reward tick simulation / manual yield sync
apiRouter.post('/mining/tick-rewards', (req: Request, res: Response) => {
  const { userId } = req.body;
  const user = db.users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  // First process any standard 24h cycles elapsed
  const yieldResult = processMiningYields(userId);

  // If none elapsed, perform an instant 1-day simulation tick for testing
  let forceTicked = 0;
  if (yieldResult.creditedTotal === 0) {
    const activeContracts = db.miningContracts.filter((c) => c.userId === userId && c.status === 'active');
    activeContracts.forEach((cntr) => {
      const dailyReward = cntr.estimatedDailyReward;
      cntr.accumulatedReward = Number((cntr.accumulatedReward + dailyReward).toFixed(2));
      forceTicked += dailyReward;

      // Record reward transaction
      db.transactions.unshift({
        id: `tx_rw_${Date.now()}_${Math.floor(Math.random() * 100)}`,
        userId: user.id,
        type: 'mining_reward',
        amount: dailyReward,
        currency: 'GHS',
        reference: `RW-${cntr.id.slice(-4)}-${Date.now().toString().slice(-4)}`,
        description: `Daily Yield (24h Tick) - ${cntr.planName}`,
        status: 'completed',
        createdAt: new Date().toISOString(),
      });
    });

    if (forceTicked > 0) {
      user.balance = Number((user.balance + forceTicked).toFixed(2));
      user.totalRewards = Number((user.totalRewards + forceTicked).toFixed(2));
      user.updatedAt = new Date().toISOString();
      db.saveData();
    }
  }

  const totalCredited = yieldResult.creditedTotal > 0 ? yieldResult.creditedTotal : forceTicked;

  res.json({
    success: true,
    message: `${totalCredited.toFixed(2)} GHS 24h mining yield credited to balance!`,
    totalTickedReward: totalCredited,
    user,
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
  db.saveData();

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
  db.saveData();

  res.json({
    success: true,
    deposit,
    paymentDetails: result,
  });
});

apiRouter.get('/deposits/:userId', (req: Request, res: Response) => {
  const userDeposits = db.deposits.filter((d) => d.userId === req.params.userId);
  res.json({ success: true, deposits: userDeposits });
});

// Demo mode action: Simulate Deposit Confirmation
apiRouter.post('/deposits/:id/confirm-demo', (req: Request, res: Response) => {
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

  db.saveData();

  res.json({
    success: true,
    message: `Deposit confirmed! GHS ${deposit.amount.toFixed(2)} added to balance.`,
    deposit,
    user,
  });
});

// ================= WITHDRAWALS =================
const handleWithdrawal = (req: Request, res: Response) => {
  const { userId, amount, destination, provider } = req.body;
  const numAmount = Number(amount);

  const user = db.users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  // STRICT REQUIREMENT: User must have made at least 1 deposit to withdraw (welcome bonus + earnings)
  const confirmedDeposits = db.deposits.filter(
    (d) => d.userId === user.id && d.status === 'confirmed'
  );
  if ((user.totalDeposits || 0) <= 0 && confirmedDeposits.length === 0) {
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

  if (user.balance < numAmount) {
    return res.status(400).json({
      success: false,
      message: `Insufficient balance. Available: GHS ${user.balance.toFixed(2)}`,
    });
  }

  // Deduct balance for withdrawal
  user.balance = Number((user.balance - numAmount).toFixed(2));
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
  db.transactions.unshift({
    id: `tx_wd_${Date.now()}`,
    userId: user.id,
    type: 'withdrawal',
    amount: numAmount,
    currency: 'GHS',
    reference: ref,
    description: `Withdrawal request to ${destination}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
  });

  db.saveData();

  res.json({
    success: true,
    message: 'Withdrawal request submitted successfully.',
    withdrawal,
    user,
  });
};

apiRouter.post('/withdrawals/demo', handleWithdrawal);
apiRouter.post('/withdrawals/create', handleWithdrawal);

apiRouter.get('/withdrawals/:userId', (req: Request, res: Response) => {
  const userWds = db.withdrawals.filter((w) => w.userId === req.params.userId);
  res.json({ success: true, withdrawals: userWds });
});

// ================= INCOME & TRANSACTIONS =================
apiRouter.get('/income/:userId', async (req: Request, res: Response) => {
  const userId = req.params.userId;
  if (isMongoConnected()) {
    try {
      await db.syncFromMongo();
    } catch (e) {}
  }
  processMiningYields(userId);
  const user = db.users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const activeContracts = db.miningContracts.filter((c) => c.userId === userId && c.status === 'active');
  const completedContracts = db.miningContracts.filter((c) => c.userId === userId && c.status === 'completed');
  const userTxs = db.transactions
    .filter((t) => t.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
apiRouter.get('/referrals/:userId', (req: Request, res: Response) => {
  const userId = req.params.userId;
  const user = db.users.find((u) => u.id === userId);
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

  const claimedList = user.claimedMilestones || [];

  // Compute milestone statuses
  const milestonesWithStatus = AFFILIATE_MILESTONES.map((m) => {
    const isUnlocked = fundedCount >= m.requiredRefs;
    const isClaimed = claimedList.includes(m.id);
    const canClaim = isUnlocked && !isClaimed;
    return {
      ...m,
      isUnlocked,
      isClaimed,
      canClaim,
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

  const user = db.users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const milestone = AFFILIATE_MILESTONES.find((m) => m.id === milestoneId);
  if (!milestone) {
    return res.status(400).json({ success: false, message: 'Invalid milestone ID' });
  }

  // Calculate actual funded referrals
  const fundedCount = getFundedReferralsCount(user.id);
  if (fundedCount < milestone.requiredRefs) {
    return res.status(400).json({
      success: false,
      message: `Qualification required: You need at least ${milestone.requiredRefs} funded referral(s) (with completed 1st deposit) to claim ${milestone.title}. Currently funded: ${fundedCount}.`,
    });
  }

  user.claimedMilestones = user.claimedMilestones || [];
  if (user.claimedMilestones.includes(milestoneId)) {
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
apiRouter.get('/admin/stats', (req: Request, res: Response) => {
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

apiRouter.post('/admin/plans', (req: Request, res: Response) => {
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
  db.saveData();

  res.json({ success: true, message: 'New mining plan created successfully', plan: newPlan });
});

apiRouter.post('/admin/plans/:id', (req: Request, res: Response) => {
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

  db.saveData();
  res.json({ success: true, message: 'Plan updated successfully', plan });
});

// Admin: Approve Deposit and Credit User Account
apiRouter.post('/admin/deposits/:id/approve', (req: Request, res: Response) => {
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

  db.saveData();
  res.json({ success: true, message: 'Deposit approved and user credited successfully', deposit, user });
});

// Admin: Reject Deposit
apiRouter.post('/admin/deposits/:id/reject', (req: Request, res: Response) => {
  const deposit = db.deposits.find((d) => d.id === req.params.id);
  if (!deposit) return res.status(404).json({ success: false, message: 'Deposit not found' });

  deposit.status = 'rejected';
  deposit.updatedAt = new Date().toISOString();

  db.saveData();
  res.json({ success: true, message: 'Deposit rejected successfully', deposit });
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
apiRouter.post('/admin/withdrawals/:id/approve', (req: Request, res: Response) => {
  const withdrawal = db.withdrawals.find((w) => w.id === req.params.id);
  if (!withdrawal) return res.status(404).json({ success: false, message: 'Withdrawal not found' });

  withdrawal.status = 'approved';
  withdrawal.updatedAt = new Date().toISOString();

  // Find corresponding transaction
  const tx = db.transactions.find((t) => t.reference === withdrawal.reference);
  if (tx) tx.status = 'completed';

  db.saveData();
  res.json({ success: true, message: 'Withdrawal approved successfully', withdrawal });
});

apiRouter.post('/admin/withdrawals/:id/reject', (req: Request, res: Response) => {
  const withdrawal = db.withdrawals.find((w) => w.id === req.params.id);
  if (!withdrawal) return res.status(404).json({ success: false, message: 'Withdrawal not found' });

  if (withdrawal.status !== 'approved') {
    // Refund balance to user
    const user = db.users.find((u) => u.id === withdrawal.userId);
    if (user) {
      user.balance = Number((user.balance + withdrawal.amount).toFixed(2));
      user.updatedAt = new Date().toISOString();
    }
  }

  withdrawal.status = 'rejected';
  withdrawal.updatedAt = new Date().toISOString();

  db.saveData();
  res.json({ success: true, message: 'Withdrawal rejected and balance refunded', withdrawal });
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
apiRouter.get('/activity-stream', (req: Request, res: Response) => {
  // Combine real user deposits & withdrawals with realistic simulated feed items
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

  // Dynamic simulated recent feed with higher crypto weighting as requested
  const simulatedFeed = [
    { id: 'sim_1', type: 'payout', isReal: false, username: 'Agyekum', amount: 850, provider: 'Crypto (USDT)', currency: 'GHS', timestamp: new Date(Date.now() - 2 * 60000).toISOString(), badge: 'LIVE PAYOUT' },
    { id: 'sim_2', type: 'deposit', isReal: false, username: 'Prempeh', amount: 480, provider: 'Telecel Cash', currency: 'GHS', timestamp: new Date(Date.now() - 4 * 60000).toISOString(), badge: 'LIVE RECHARGE' },
    { id: 'sim_3', type: 'payout', isReal: false, username: 'Kwame', amount: 1250, provider: 'Crypto (USDT - TRC20)', currency: 'GHS', timestamp: new Date(Date.now() - 7 * 60000).toISOString(), badge: 'LIVE PAYOUT' },
    { id: 'sim_4', type: 'deposit', isReal: false, username: 'Emmanuel', amount: 1500, provider: 'Crypto (USDT)', currency: 'GHS', timestamp: new Date(Date.now() - 11 * 60000).toISOString(), badge: 'PRO RECHARGE' },
    { id: 'sim_5', type: 'payout', isReal: false, username: 'Kofi', amount: 720, provider: 'MTN MoMo', currency: 'GHS', timestamp: new Date(Date.now() - 15 * 60000).toISOString(), badge: 'LIVE PAYOUT' },
    { id: 'sim_6', type: 'payout', isReal: false, username: 'Grace', amount: 2400, provider: 'Crypto (USDT - BEP20)', currency: 'GHS', timestamp: new Date(Date.now() - 20 * 60000).toISOString(), badge: 'LIVE PAYOUT' },
    { id: 'sim_7', type: 'deposit', isReal: false, username: 'Daniel', amount: 950, provider: 'Crypto (BTC)', currency: 'GHS', timestamp: new Date(Date.now() - 26 * 60000).toISOString(), badge: 'LIVE RECHARGE' },
    { id: 'sim_8', type: 'payout', isReal: false, username: 'Abena', amount: 650, provider: 'Crypto (USDT)', currency: 'GHS', timestamp: new Date(Date.now() - 33 * 60000).toISOString(), badge: 'LIVE PAYOUT' },
    { id: 'sim_9', type: 'payout', isReal: false, username: 'Belinda', amount: 1800, provider: 'Crypto (TRON)', currency: 'GHS', timestamp: new Date(Date.now() - 41 * 60000).toISOString(), badge: 'LIVE PAYOUT' },
    { id: 'sim_10', type: 'payout', isReal: false, username: 'Frank', amount: 600, provider: 'MTN MoMo', currency: 'GHS', timestamp: new Date(Date.now() - 52 * 60000).toISOString(), badge: 'LIVE PAYOUT' },
  ];

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