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
import { calculateEstimatedReward } from '../services/rewardEngine';
import { getCryptoRates, convertFiatToCrypto } from '../services/cryptoPriceService';
import { mobileMoneyProvider } from '../services/payment/mobileMoneyProvider';
import { cryptoProvider } from '../services/payment/cryptoProvider';
import { sendPasswordResetEmail } from '../services/emailService';
import { UserModel, isMongoConnected } from '../config/dbMongo';

export const apiRouter = Router();

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

  // Only pay referral bonus on the first confirmed deposit
  if (!isFirstConfirmedDeposit(user.id, deposit.id)) return;

  const bonusAmount = Number((deposit.amount * 0.07).toFixed(2));

  referrer.balance = Number((referrer.balance + bonusAmount).toFixed(2));
  referrer.totalRewards = Number(((referrer.totalRewards || 0) + bonusAmount).toFixed(2));

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
    currency: 'GHS',
    reference: `REF-BONUS-${user.username.toUpperCase()}`,
    description: `7% Referral Commission Bonus from ${user.username}`,
    status: 'completed',
    createdAt: new Date().toISOString(),
  });
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
      const mongoUser: any = await UserModel.findOne({ id: req.params.id } as any).lean();
      if (mongoUser) {
        const userObj = mongoUser as UserCloudMineX;
        const idx = db.users.findIndex((u) => u.id === userObj.id);
        if (idx >= 0) db.users[idx] = userObj;
        else db.users.push(userObj);
        return res.json({ success: true, user: userObj });
      } else {
        // User was deleted in MongoDB!
        db.users = db.users.filter((u) => u.id !== req.params.id);
        db.saveData();
        return res.status(404).json({ success: false, message: 'User not found or deleted from database.' });
      }
    } catch (e) {}
  }
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

apiRouter.get('/mining/user/:userId', (req: Request, res: Response) => {
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

// Trigger daily reward tick simulation
apiRouter.post('/mining/tick-rewards', (req: Request, res: Response) => {
  const { userId } = req.body;
  const user = db.users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const activeContracts = db.miningContracts.filter((c) => c.userId === userId && c.status === 'active');
  let totalTickedReward = 0;

  activeContracts.forEach((cntr) => {
    const dailyReward = cntr.estimatedDailyReward;
    cntr.accumulatedReward = Number((cntr.accumulatedReward + dailyReward).toFixed(2));
    totalTickedReward += dailyReward;

    // Record reward transaction
    db.transactions.unshift({
      id: `tx_rw_${Date.now()}_${Math.floor(Math.random() * 100)}`,
      userId: user.id,
      type: 'mining_reward',
      amount: dailyReward,
      currency: 'GHS',
      reference: `RW-${cntr.id.slice(-4)}-${Date.now().toString().slice(-4)}`,
      description: `Daily Yield - ${cntr.planName}`,
      status: 'completed',
      createdAt: new Date().toISOString(),
    });
  });

  if (totalTickedReward > 0) {
    user.balance = Number((user.balance + totalTickedReward).toFixed(2));
    user.totalRewards = Number((user.totalRewards + totalTickedReward).toFixed(2));
    user.updatedAt = new Date().toISOString();
    db.saveData();
  }

  res.json({
    success: true,
    message: `${totalTickedReward.toFixed(2)} GHS mining reward credited!`,
    totalTickedReward,
    user,
  });
});

// ================= RECHARGE & DEPOSITS =================
apiRouter.get('/crypto/currencies', (req: Request, res: Response) => {
  const rates = getCryptoRates();
  res.json({
    success: true,
    rates,
    addresses: {
      BTC: db.settings.btcAddress,
      ETH: db.settings.ethAddress,
      USDT: {
        'ERC-20': db.settings.usdtErc20Address,
        'TRC-20': db.settings.usdtTrc20Address,
        'BEP-20': db.settings.usdtBep20Address,
      },
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
apiRouter.get('/income/:userId', (req: Request, res: Response) => {
  const userId = req.params.userId;
  const user = db.users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const activeContracts = db.miningContracts.filter((c) => c.userId === userId && c.status === 'active');
  const completedContracts = db.miningContracts.filter((c) => c.userId === userId && c.status === 'completed');
  const userTxs = db.transactions.filter((t) => t.userId === userId);

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

  // Also sync with db.referrals table
  const userRefs = db.referrals.filter((r) => r.referrerId === userId);

  const totalInvited = Math.max(referredUsers.length, userRefs.length);

  // Count funded referrals (referred users with at least 1 deposit)
  let fundedCount = 0;
  const enrichedTeamMembers = (referredUsers.length > 0 ? referredUsers : userRefs).map((m: any) => {
    const referredUserObj = db.users.find(
      (u) => u.id === (m.id || m.referredUserId) || u.username === (m.username || m.referredUsername)
    );
    const userDeposits = db.deposits.filter(
      (d) => d.userId === (referredUserObj ? referredUserObj.id : '') && d.status === 'confirmed'
    );
    const isFunded =
      (referredUserObj && (referredUserObj.totalDeposits || 0) > 0) ||
      userDeposits.length > 0 ||
      m.status === 'funded';

    if (isFunded) {
      fundedCount++;
    }

    return {
      id: m.id || `ref_${m.referredUserId}`,
      referredUserId: referredUserObj ? referredUserObj.id : (m.referredUserId || m.id),
      referredUsername: referredUserObj ? referredUserObj.username : (m.referredUsername || m.username || 'Miner'),
      createdAt: m.createdAt || new Date().toISOString(),
      isFunded,
      totalDeposits: referredUserObj ? (referredUserObj.totalDeposits || 0) : 0,
      reward: m.reward || 0,
      status: isFunded ? 'funded' : 'registered',
    };
  });

  // Calculate VIP Tier
  let vipTier = 'Bronze VIP';
  let nextTierRequirement = `${10 - fundedCount} funded referral(s) left to Silver VIP`;

  if (fundedCount >= 30) {
    vipTier = 'Diamond VIP';
    nextTierRequirement = 'Maximum VIP Tier Reached 🏆';
  } else if (fundedCount >= 20) {
    vipTier = 'Gold VIP';
    nextTierRequirement = `${30 - fundedCount} funded referral(s) left to Diamond VIP`;
  } else if (fundedCount >= 10) {
    vipTier = 'Silver VIP';
    nextTierRequirement = `${20 - fundedCount} funded referral(s) left to Gold VIP`;
  }

  // Update user's VIP tier in memory
  user.vipTier = vipTier;

  const totalRefRewards = enrichedTeamMembers.reduce((sum: number, r: any) => sum + (r.reward || 0), 0);

  res.json({
    success: true,
    referralCode: user.username,
    totalInvited,
    fundedReferralsCount: fundedCount,
    vipTier,
    nextTierRequirement,
    referralRewards: totalRefRewards,
    simulatedReferralRewards: totalRefRewards,
    teamMembers: enrichedTeamMembers,
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

  // Dynamic simulated recent feed with clean single usernames (no initials)
  const simulatedFeed = [
    { id: 'sim_1', type: 'payout', isReal: false, username: 'Kwame', amount: 350, provider: 'MTN MoMo', currency: 'GHS', timestamp: new Date(Date.now() - 2 * 60000).toISOString(), badge: 'LIVE PAYOUT' },
    { id: 'sim_2', type: 'deposit', isReal: false, username: 'Abena', amount: 500, provider: 'Telecel Cash', currency: 'GHS', timestamp: new Date(Date.now() - 5 * 60000).toISOString(), badge: 'LIVE RECHARGE' },
    { id: 'sim_3', type: 'payout', isReal: false, username: 'Kofi', amount: 720, provider: 'MTN MoMo', currency: 'GHS', timestamp: new Date(Date.now() - 9 * 60000).toISOString(), badge: 'LIVE PAYOUT' },
    { id: 'sim_4', type: 'deposit', isReal: false, username: 'Emmanuel', amount: 1500, provider: 'Crypto (USDT)', currency: 'GHS', timestamp: new Date(Date.now() - 14 * 60000).toISOString(), badge: 'PRO RECHARGE' },
    { id: 'sim_5', type: 'payout', isReal: false, username: 'Rita', amount: 200, provider: 'AT Money', currency: 'GHS', timestamp: new Date(Date.now() - 20 * 60000).toISOString(), badge: 'LIVE PAYOUT' },
    { id: 'sim_6', type: 'deposit', isReal: false, username: 'Daniel', amount: 700, provider: 'MTN MoMo', currency: 'GHS', timestamp: new Date(Date.now() - 26 * 60000).toISOString(), badge: 'LIVE RECHARGE' },
    { id: 'sim_7', type: 'payout', isReal: false, username: 'Grace', amount: 1200, provider: 'Crypto (USDT)', currency: 'GHS', timestamp: new Date(Date.now() - 33 * 60000).toISOString(), badge: 'LIVE PAYOUT' },
    { id: 'sim_8', type: 'payout', isReal: false, username: 'Belinda', amount: 450, provider: 'MTN MoMo', currency: 'GHS', timestamp: new Date(Date.now() - 41 * 60000).toISOString(), badge: 'LIVE PAYOUT' },
    { id: 'sim_9', type: 'payout', isReal: false, username: 'Bob', amount: 180, provider: 'Telecel Cash', currency: 'GHS', timestamp: new Date(Date.now() - 52 * 60000).toISOString(), badge: 'LIVE PAYOUT' },
    { id: 'sim_10', type: 'payout', isReal: false, username: 'Frank', amount: 600, provider: 'MTN MoMo', currency: 'GHS', timestamp: new Date(Date.now() - 58 * 60000).toISOString(), badge: 'LIVE PAYOUT' },
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