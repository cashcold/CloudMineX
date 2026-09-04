var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/config/dbMongo.ts
var dbMongo_exports = {};
__export(dbMongo_exports, {
  AppSettingsModel: () => AppSettingsModel,
  ChatMessageModel: () => ChatMessageModel,
  DepositModel: () => DepositModel,
  MiningContractModel: () => MiningContractModel,
  MiningPlanModel: () => MiningPlanModel,
  ReferralModel: () => ReferralModel,
  TransactionModel: () => TransactionModel,
  UserModel: () => UserModel,
  WithdrawalModel: () => WithdrawalModel,
  connectMongoDB: () => connectMongoDB,
  isMongoConnected: () => isMongoConnected
});
import mongoose, { Schema } from "mongoose";
async function connectMongoDB() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.log("[MongoDB] MONGODB_URI/MONGO_URI environment variable is not set. Operating with local persistent store.");
    return false;
  }
  if (isConnected && mongoose.connection.readyState === 1) return true;
  try {
    console.log("[MongoDB] Attempting to connect to MongoDB cluster (Database: CloudMineX)...");
    await mongoose.connect(mongoUri, {
      dbName: process.env.MONGODB_DB_NAME || "CloudMineX",
      serverSelectionTimeoutMS: 5e3
    });
    isConnected = true;
    console.log("----------------------------------------------------");
    console.log("\u{1F680} [MongoDB] Successfully connected to CloudMineX MongoDB database!");
    console.log("----------------------------------------------------");
    return true;
  } catch (err) {
    console.error("\u274C [MongoDB] Connection error:", err.message || err);
    return false;
  }
}
function isMongoConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}
var userSchema, miningPlanSchema, miningContractSchema, depositSchema, withdrawalSchema, transactionSchema, referralSchema, chatMessageSchema, appSettingsSchema, UserModel, MiningPlanModel, MiningContractModel, DepositModel, WithdrawalModel, TransactionModel, ReferralModel, ChatMessageModel, AppSettingsModel, isConnected;
var init_dbMongo = __esm({
  "server/config/dbMongo.ts"() {
    userSchema = new Schema({
      id: { type: String, required: true, unique: true },
      username: { type: String, required: true },
      email: { type: String },
      phone: { type: String },
      password: { type: String },
      paymentMethod: { type: String },
      paymentAddress: { type: String },
      balance: { type: Number, default: 0 },
      totalDeposits: { type: Number, default: 0 },
      currency: { type: String, default: "GHS" },
      referralCode: { type: String, default: "" },
      referredBy: { type: String },
      vipLevel: { type: Number },
      vipTier: { type: String },
      claimedMilestones: { type: [String], default: [] },
      totalRewards: { type: Number, default: 0 },
      activeContracts: { type: Number, default: 0 },
      createdAt: { type: String },
      updatedAt: { type: String }
    });
    miningPlanSchema = new Schema({
      id: { type: String, required: true, unique: true },
      name: { type: String, required: true },
      description: { type: String },
      price: { type: Number, required: true },
      duration: { type: Number, required: true },
      rewardRate: { type: Number, required: true },
      estimatedDailyReward: { type: Number, required: true },
      estimatedTotalReward: { type: Number, required: true },
      image: { type: String, default: "" },
      active: { type: Boolean, default: true },
      createdAt: { type: String },
      updatedAt: { type: String }
    });
    miningContractSchema = new Schema({
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
      status: { type: String, enum: ["active", "completed", "cancelled"], default: "active" },
      createdAt: { type: String },
      updatedAt: { type: String }
    });
    depositSchema = new Schema({
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
      status: { type: String, default: "pending" },
      confirmations: { type: Number, default: 0 },
      requiredConfirmations: { type: Number, default: 3 },
      createdAt: { type: String },
      updatedAt: { type: String }
    });
    withdrawalSchema = new Schema({
      id: { type: String, required: true, unique: true },
      userId: { type: String, required: true },
      amount: { type: Number, required: true },
      currency: { type: String, default: "GHS" },
      destination: { type: String, required: true },
      provider: { type: String, required: true },
      reference: { type: String, required: true },
      status: { type: String, default: "pending" },
      createdAt: { type: String },
      updatedAt: { type: String }
    });
    transactionSchema = new Schema({
      id: { type: String, required: true, unique: true },
      userId: { type: String, required: true },
      type: { type: String, required: true },
      amount: { type: Number, required: true },
      currency: { type: String, default: "GHS" },
      reference: { type: String },
      description: { type: String },
      status: { type: String, default: "completed" },
      metadata: { type: Schema.Types.Mixed },
      createdAt: { type: String }
    });
    referralSchema = new Schema({
      id: { type: String, required: true, unique: true },
      referrerId: { type: String, required: true },
      referredUserId: { type: String, required: true },
      referredUsername: { type: String, required: true },
      referralCode: { type: String },
      reward: { type: Number, default: 0 },
      status: { type: String, default: "pending" },
      createdAt: { type: String }
    });
    chatMessageSchema = new Schema({
      id: { type: String, required: true, unique: true },
      username: { type: String, required: true },
      text: { type: String, required: true },
      badge: { type: String },
      type: { type: String },
      createdAt: { type: String }
    });
    appSettingsSchema = new Schema({
      demoMode: { type: Boolean, default: true },
      baseCurrency: { type: String, default: "GHS" },
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
      referralBonusPercent: { type: Number, default: 7 }
    });
    UserModel = mongoose.models.UserCloudMineX || mongoose.model("UserCloudMineX", userSchema);
    MiningPlanModel = mongoose.models.MiningPlanCloudMineX || mongoose.model("MiningPlanCloudMineX", miningPlanSchema);
    MiningContractModel = mongoose.models.MiningContractCloudMineX || mongoose.model("MiningContractCloudMineX", miningContractSchema);
    DepositModel = mongoose.models.DepositCloudMineX || mongoose.model("DepositCloudMineX", depositSchema);
    WithdrawalModel = mongoose.models.WithdrawalCloudMineX || mongoose.model("WithdrawalCloudMineX", withdrawalSchema);
    TransactionModel = mongoose.models.TransactionCloudMineX || mongoose.model("TransactionCloudMineX", transactionSchema);
    ReferralModel = mongoose.models.ReferralCloudMineX || mongoose.model("ReferralCloudMineX", referralSchema);
    ChatMessageModel = mongoose.models.ChatMessageCloudMineX || mongoose.model("ChatMessageCloudMineX", chatMessageSchema);
    AppSettingsModel = mongoose.models.AppSettingsCloudMineX || mongoose.model("AppSettingsCloudMineX", appSettingsSchema);
    isConnected = false;
  }
});

// server/serverless.ts
import "dotenv/config";
import express from "express";
import cors from "cors";

// server/routes/api.ts
import { Router } from "express";

// server/config/dbStore.ts
import fs from "fs";
import path from "path";
var DATA_FILE = path.join(process.cwd(), "cloudminex_data.json");
var TMP_DATA_FILE = path.join("/tmp", "cloudminex_data.json");
var DBStore = class {
  constructor() {
    this.users = [];
    this.miningPlans = [];
    this.miningContracts = [];
    this.deposits = [];
    this.withdrawals = [];
    this.transactions = [];
    this.referrals = [];
    this.chatMessages = [];
    this.passwordResetOtps = [];
    this.settings = {
      demoMode: true,
      baseCurrency: "GHS",
      btcAddress: process.env.BTC_DEPOSIT_ADDRESS || "15512yaegwoVpZ2mjnsZ8mmVdhMnbcYybZ",
      ethAddress: process.env.ETH_DEPOSIT_ADDRESS || "0x450306b9721d2cc03a70f3c6aa9b7a61b0137b44",
      usdtErc20Address: process.env.USDT_ERC20_ADDRESS || "0x450306b9721d2cc03a70f3c6aa9b7a61b0137b44",
      usdtTrc20Address: process.env.USDT_TRC20_ADDRESS || "TMmpdCUFH9xJ5efivRdyAw8MBVGqdsJmpX",
      usdtBep20Address: process.env.USDT_BEP20_ADDRESS || "0x450306b9721d2cc03a70f3c6aa9b7a61b0137b44",
      confirmationsBtc: Number(process.env.REQUIRED_CONFIRMATIONS_BTC) || 3,
      confirmationsEth: Number(process.env.REQUIRED_CONFIRMATIONS_ETH) || 12,
      confirmationsUsdt: Number(process.env.REQUIRED_CONFIRMATIONS_USDT) || 12,
      mtnMerchantName: "CloudMineX Ghana MoMo",
      mtnMerchantNumber: "+233 24 123 4567",
      telecelMerchantName: "CloudMineX Telecel Cash",
      telecelMerchantNumber: "+233 20 987 6543",
      atMerchantName: "CloudMineX AT Money",
      atMerchantNumber: "+233 27 555 0192",
      vodafoneMerchantName: "Vodafone Cash",
      vodafoneMerchantNumber: "0202496815",
      vodafoneAccountName: "Charles Asumah",
      vodafoneWalletType: "Vodafone Cash",
      referralBonusPercent: 7
    };
    this.loadData();
  }
  loadData() {
    try {
      let fileToRead = DATA_FILE;
      if (process.env.VERCEL && fs.existsSync(TMP_DATA_FILE)) {
        fileToRead = TMP_DATA_FILE;
      }
      if (fs.existsSync(fileToRead)) {
        const fileContent = fs.readFileSync(fileToRead, "utf-8");
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
      console.error("Error reading cloudminex_data.json, seeding defaults:", err);
      this.seedInitialData();
    }
  }
  ensureDefaultPlans() {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const defaultPlans = [
      {
        id: "plan_starter",
        name: "STARTER MINER",
        description: "Entry level cloud rig for new digital miners.",
        price: 100,
        duration: 7,
        rewardRate: 0.05,
        estimatedDailyReward: 5,
        estimatedTotalReward: 35,
        image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=400&q=80",
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: "plan_basic",
        name: "BASIC MINER",
        description: "Reliable dual-chip miner with enhanced daily yield.",
        price: 300,
        duration: 14,
        rewardRate: 0.06,
        estimatedDailyReward: 18,
        estimatedTotalReward: 252,
        image: "https://images.unsplash.com/photo-1622979135225-d2ba269bc1bd?auto=format&fit=crop&w=400&q=80",
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: "plan_pro",
        name: "PRO MINER",
        description: "High-performance cloud mining rig with steady 30-day payout.",
        price: 700,
        duration: 30,
        rewardRate: 0.07,
        estimatedDailyReward: 49,
        estimatedTotalReward: 1470,
        image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80",
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: "plan_advanced",
        name: "ADVANCED MINER",
        description: "Industrial grade GPU array miner for maximum yield potential.",
        price: 1500,
        duration: 60,
        rewardRate: 0.08,
        estimatedDailyReward: 120,
        estimatedTotalReward: 7200,
        image: "https://images.unsplash.com/photo-1605792657660-596af9009e82?auto=format&fit=crop&w=400&q=80",
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: "plan_premium",
        name: "PREMIUM MINER",
        description: "Flagship enterprise ASIC cluster for long-term rewards.",
        price: 3e3,
        duration: 90,
        rewardRate: 0.09,
        estimatedDailyReward: 270,
        estimatedTotalReward: 24300,
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80",
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: "plan_vip",
        name: "VIP MINER",
        description: "VIP multi-hash node dedicated to high-frequency block rewards.",
        price: 5e3,
        duration: 90,
        rewardRate: 0.1,
        estimatedDailyReward: 500,
        estimatedTotalReward: 45e3,
        image: "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=400&q=80",
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: "plan_enterprise",
        name: "ENTERPRISE MINER",
        description: "Enterprise datacenter rack with priority network bandwidth and 11% daily ROI.",
        price: 1e4,
        duration: 120,
        rewardRate: 0.11,
        estimatedDailyReward: 1100,
        estimatedTotalReward: 132e3,
        image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80",
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: "plan_titan",
        name: "TITAN RIG MINER",
        description: "Ultra-high density 20,000 GHC industrial mining rig with 12% daily compound yield.",
        price: 2e4,
        duration: 180,
        rewardRate: 0.12,
        estimatedDailyReward: 2400,
        estimatedTotalReward: 432e3,
        image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=400&q=80",
        active: true,
        createdAt: now,
        updatedAt: now
      }
    ];
    let modified = false;
    for (const def of defaultPlans) {
      const idx = this.miningPlans.findIndex((p) => p.id === def.id);
      if (idx === -1) {
        this.miningPlans.push(def);
        modified = true;
      } else {
        const current = this.miningPlans[idx];
        if (current.price !== def.price || current.duration !== def.duration || current.rewardRate !== def.rewardRate || current.estimatedDailyReward !== def.estimatedDailyReward) {
          this.miningPlans[idx] = { ...current, ...def };
          modified = true;
        }
      }
    }
    if (modified) {
      this.saveData();
    }
  }
  saveData() {
    const data = {
      users: this.users,
      miningPlans: this.miningPlans,
      miningContracts: this.miningContracts,
      deposits: this.deposits,
      withdrawals: this.withdrawals,
      transactions: this.transactions,
      referrals: this.referrals,
      chatMessages: this.chatMessages,
      settings: this.settings
    };
    const jsonString = JSON.stringify(data, null, 2);
    try {
      const targetFile = process.env.VERCEL ? TMP_DATA_FILE : DATA_FILE;
      fs.writeFileSync(targetFile, jsonString, "utf-8");
    } catch (err) {
      try {
        fs.writeFileSync(TMP_DATA_FILE, jsonString, "utf-8");
      } catch (tmpErr) {
        console.warn("[DBStore] Read-only serverless filesystem warning. Using in-memory & MongoDB persistence.");
      }
    }
    this.syncToMongo().catch((err) => {
    });
  }
  async syncToMongo() {
    try {
      const {
        isMongoConnected: isMongoConnected2,
        UserModel: UserModel2,
        MiningPlanModel: MiningPlanModel2,
        MiningContractModel: MiningContractModel2,
        DepositModel: DepositModel2,
        WithdrawalModel: WithdrawalModel2,
        TransactionModel: TransactionModel2,
        ReferralModel: ReferralModel2,
        ChatMessageModel: ChatMessageModel2,
        AppSettingsModel: AppSettingsModel2
      } = await Promise.resolve().then(() => (init_dbMongo(), dbMongo_exports));
      if (!isMongoConnected2()) return;
      for (const u of this.users) {
        await UserModel2.updateOne({ id: u.id }, u, { upsert: true });
      }
      for (const p of this.miningPlans) {
        await MiningPlanModel2.updateOne({ id: p.id }, p, { upsert: true });
      }
      for (const c of this.miningContracts) {
        await MiningContractModel2.updateOne({ id: c.id }, c, { upsert: true });
      }
      for (const d of this.deposits) {
        await DepositModel2.updateOne({ id: d.id }, d, { upsert: true });
      }
      for (const w of this.withdrawals) {
        await WithdrawalModel2.updateOne({ id: w.id }, w, { upsert: true });
      }
      for (const t of this.transactions) {
        await TransactionModel2.updateOne({ id: t.id }, t, { upsert: true });
      }
      for (const r of this.referrals) {
        await ReferralModel2.updateOne({ id: r.id }, r, { upsert: true });
      }
      for (const cm of this.chatMessages) {
        await ChatMessageModel2.updateOne({ id: cm.id }, cm, { upsert: true });
      }
      await AppSettingsModel2.updateOne({}, this.settings, { upsert: true });
    } catch (err) {
      console.error("[MongoDB] Sync error:", err);
    }
  }
  async syncFromMongo() {
    try {
      const {
        isMongoConnected: isMongoConnected2,
        UserModel: UserModel2,
        MiningPlanModel: MiningPlanModel2,
        MiningContractModel: MiningContractModel2,
        DepositModel: DepositModel2,
        WithdrawalModel: WithdrawalModel2,
        TransactionModel: TransactionModel2,
        ReferralModel: ReferralModel2,
        ChatMessageModel: ChatMessageModel2,
        AppSettingsModel: AppSettingsModel2
      } = await Promise.resolve().then(() => (init_dbMongo(), dbMongo_exports));
      if (!isMongoConnected2()) return;
      const mongoUsers = await UserModel2.find().lean();
      if (mongoUsers) {
        this.users = mongoUsers.map((u) => ({
          id: u.id,
          username: u.username,
          email: u.email,
          phone: u.phone,
          password: u.password,
          paymentMethod: u.paymentMethod,
          paymentAddress: u.paymentAddress,
          balance: u.balance || 0,
          totalDeposits: u.totalDeposits || 0,
          currency: u.currency || "GHS",
          referralCode: u.referralCode || u.refCode || "CMX-" + Math.floor(Math.random() * 8999 + 1e3),
          referredBy: u.referredBy || null,
          vipLevel: u.vipLevel,
          vipTier: u.vipTier,
          totalRewards: u.totalRewards || 0,
          activeContracts: u.activeContracts || 0,
          createdAt: u.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: u.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
        }));
      }
      const mongoPlans = await MiningPlanModel2.find().lean();
      if (mongoPlans && mongoPlans.length > 0) {
        this.miningPlans = mongoPlans.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description || "",
          price: p.price,
          duration: p.duration,
          rewardRate: p.rewardRate,
          estimatedDailyReward: p.estimatedDailyReward,
          estimatedTotalReward: p.estimatedTotalReward,
          image: p.image || "https://images.unsplash.com/photo-1622979135225-d2ba269bc1bd?auto=format&fit=crop&w=600&q=80",
          active: p.active !== void 0 ? p.active : true,
          createdAt: p.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: p.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
        }));
      }
      this.ensureDefaultPlans();
      const mongoDeposits = await DepositModel2.find().lean();
      if (mongoDeposits) {
        this.deposits = mongoDeposits.map((d) => ({
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
          createdAt: d.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: d.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
        }));
      }
      const mongoWithdrawals = await WithdrawalModel2.find().lean();
      if (mongoWithdrawals) {
        this.withdrawals = mongoWithdrawals.map((w) => ({
          id: w.id,
          userId: w.userId,
          amount: w.amount,
          currency: w.currency || "GHS",
          destination: w.destination,
          provider: w.provider,
          reference: w.reference,
          status: w.status,
          createdAt: w.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: w.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
        }));
      }
      const mongoContracts = await MiningContractModel2.find().lean();
      if (mongoContracts && mongoContracts.length > 0) {
        this.miningContracts = mongoContracts.map((c) => ({
          id: c.id,
          userId: c.userId,
          planId: c.planId,
          planName: c.planName,
          amount: c.amount,
          duration: c.duration,
          rewardRate: c.rewardRate,
          estimatedDailyReward: c.estimatedDailyReward,
          estimatedTotalReward: c.estimatedTotalReward,
          accumulatedReward: c.accumulatedReward || 0,
          startDate: c.startDate || c.createdAt,
          endDate: c.endDate,
          lastCalculatedAt: c.lastCalculatedAt || c.startDate || c.createdAt,
          status: c.status || "active",
          createdAt: c.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: c.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
        }));
      }
      const mongoTx = await TransactionModel2.find().lean();
      if (mongoTx) {
        this.transactions = mongoTx.map((t) => ({
          id: t.id,
          userId: t.userId,
          type: t.type,
          amount: t.amount,
          currency: t.currency || "GHS",
          reference: t.reference || "",
          description: t.description || "",
          status: t.status || "completed",
          metadata: t.metadata,
          createdAt: t.createdAt || (/* @__PURE__ */ new Date()).toISOString()
        }));
      }
      const mongoReferrals = await ReferralModel2.find().lean();
      if (mongoReferrals && mongoReferrals.length > 0) {
        this.referrals = mongoReferrals.map((r) => ({
          id: r.id,
          referrerId: r.referrerId,
          referredUserId: r.referredUserId || r.refereeId || "",
          referredUsername: r.referredUsername || r.refereeUsername || "Member",
          referralCode: r.referralCode,
          reward: r.reward ?? r.bonusAmount ?? 0,
          status: r.status || "completed",
          createdAt: r.createdAt || (/* @__PURE__ */ new Date()).toISOString()
        }));
      }
      const mongoChat = await ChatMessageModel2.find().lean();
      if (mongoChat && mongoChat.length > 0) {
        this.chatMessages = mongoChat.map((cm) => ({
          id: cm.id,
          username: cm.username || cm.sender || "Member",
          text: cm.text,
          badge: cm.badge,
          type: cm.type || "chat",
          createdAt: cm.createdAt || cm.timestamp || (/* @__PURE__ */ new Date()).toISOString()
        }));
      }
      const mongoSettings = await AppSettingsModel2.findOne().lean();
      if (mongoSettings) {
        this.settings = {
          ...this.settings,
          ...mongoSettings,
          // Ensure configured environment / newest user addresses take priority if set
          btcAddress: process.env.BTC_DEPOSIT_ADDRESS || mongoSettings.btcAddress || "15512yaegwoVpZ2mjnsZ8mmVdhMnbcYybZ",
          ethAddress: process.env.ETH_DEPOSIT_ADDRESS || mongoSettings.ethAddress || "0x450306b9721d2cc03a70f3c6aa9b7a61b0137b44",
          usdtTrc20Address: process.env.USDT_TRC20_ADDRESS || mongoSettings.usdtTrc20Address || "TMmpdCUFH9xJ5efivRdyAw8MBVGqdsJmpX",
          usdtErc20Address: process.env.USDT_ERC20_ADDRESS || mongoSettings.usdtErc20Address || "0x450306b9721d2cc03a70f3c6aa9b7a61b0137b44",
          usdtBep20Address: process.env.USDT_BEP20_ADDRESS || mongoSettings.usdtBep20Address || "0x450306b9721d2cc03a70f3c6aa9b7a61b0137b44"
        };
      }
      console.log(`[MongoDB] Synced all records from MongoDB database into active memory (${this.users.length} users active).`);
    } catch (err) {
      console.error("[MongoDB] Fetch error:", err);
    }
  }
  seedInitialData() {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const demoUser = {
      id: "usr_demo_101",
      username: "demoUser",
      balance: 1e3,
      currency: "GHS",
      referralCode: "CMX-7892",
      totalRewards: 125.5,
      activeContracts: 1,
      createdAt: now,
      updatedAt: now
    };
    this.users = [demoUser];
    this.miningPlans = [
      {
        id: "plan_starter",
        name: "STARTER MINER",
        description: "Entry level cloud rig for new digital miners.",
        price: 100,
        duration: 7,
        rewardRate: 0.05,
        // 5% daily
        estimatedDailyReward: 5,
        estimatedTotalReward: 35,
        image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=400&q=80",
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: "plan_basic",
        name: "BASIC MINER",
        description: "Reliable dual-chip miner with enhanced daily yield.",
        price: 300,
        duration: 14,
        rewardRate: 0.06,
        // 6% daily
        estimatedDailyReward: 18,
        estimatedTotalReward: 252,
        image: "https://images.unsplash.com/photo-1622979135225-d2ba269bc1bd?auto=format&fit=crop&w=400&q=80",
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: "plan_pro",
        name: "PRO MINER",
        description: "High-performance cloud mining rig with steady 30-day payout.",
        price: 700,
        duration: 30,
        rewardRate: 0.07,
        // 7% daily
        estimatedDailyReward: 49,
        estimatedTotalReward: 1470,
        image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80",
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: "plan_advanced",
        name: "ADVANCED MINER",
        description: "Industrial grade GPU array miner for maximum yield potential.",
        price: 1500,
        duration: 60,
        rewardRate: 0.08,
        // 8% daily
        estimatedDailyReward: 120,
        estimatedTotalReward: 7200,
        image: "https://images.unsplash.com/photo-1605792657660-596af9009e82?auto=format&fit=crop&w=400&q=80",
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: "plan_premium",
        name: "PREMIUM MINER",
        description: "Flagship enterprise ASIC cluster for long-term rewards.",
        price: 3e3,
        duration: 90,
        rewardRate: 0.09,
        // 9% daily
        estimatedDailyReward: 270,
        estimatedTotalReward: 24300,
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80",
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: "plan_vip",
        name: "VIP MINER",
        description: "VIP multi-hash node dedicated to high-frequency block rewards.",
        price: 5e3,
        duration: 90,
        rewardRate: 0.1,
        // 10% daily
        estimatedDailyReward: 500,
        estimatedTotalReward: 45e3,
        image: "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=400&q=80",
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: "plan_enterprise",
        name: "ENTERPRISE MINER",
        description: "Enterprise datacenter rack with priority network bandwidth and 11% daily ROI.",
        price: 1e4,
        duration: 120,
        rewardRate: 0.11,
        // 11% daily
        estimatedDailyReward: 1100,
        estimatedTotalReward: 132e3,
        image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80",
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: "plan_titan",
        name: "TITAN RIG MINER",
        description: "Ultra-high density 20,000 GHC industrial mining rig with 12% daily compound yield.",
        price: 2e4,
        duration: 180,
        rewardRate: 0.12,
        // 12% daily
        estimatedDailyReward: 2400,
        estimatedTotalReward: 432e3,
        image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=400&q=80",
        active: true,
        createdAt: now,
        updatedAt: now
      }
    ];
    const starterPlan = this.miningPlans[0];
    const startDate = new Date(Date.now() - 2 * 864e5).toISOString();
    const endDate = new Date(Date.now() + 5 * 864e5).toISOString();
    this.miningContracts = [
      {
        id: "cntr_demo_001",
        userId: "usr_demo_101",
        planId: starterPlan.id,
        planName: starterPlan.name,
        amount: starterPlan.price,
        duration: starterPlan.duration,
        rewardRate: starterPlan.rewardRate,
        estimatedDailyReward: starterPlan.estimatedDailyReward,
        estimatedTotalReward: starterPlan.estimatedTotalReward,
        accumulatedReward: 10,
        // 2 days of rewards
        startDate,
        endDate,
        lastCalculatedAt: startDate,
        status: "active",
        createdAt: startDate,
        updatedAt: startDate
      }
    ];
    this.transactions = [
      {
        id: "tx_seed_001",
        userId: "usr_demo_101",
        type: "deposit",
        amount: 1e3,
        currency: "GHS",
        reference: "DEP-MOMO-9182",
        description: "Mobile Money Welcome Credit",
        status: "completed",
        createdAt: new Date(Date.now() - 5 * 864e5).toISOString()
      },
      {
        id: "tx_seed_002",
        userId: "usr_demo_101",
        type: "mining_purchase",
        amount: 100,
        currency: "GHS",
        reference: "PURCHASE-STARTER-01",
        description: "Starter Miner Contract Activation",
        status: "completed",
        createdAt: startDate
      },
      {
        id: "tx_seed_003",
        userId: "usr_demo_101",
        type: "mining_reward",
        amount: 5,
        currency: "GHS",
        reference: "REWARD-DAY-1",
        description: "Simulated Mining Reward - Starter Miner",
        status: "completed",
        createdAt: new Date(Date.now() - 1 * 864e5).toISOString()
      }
    ];
    this.referrals = [
      {
        id: "ref_001",
        referrerId: "usr_demo_101",
        referredUserId: "usr_ref_201",
        referredUsername: "Kwame_Miner",
        referralCode: "CMX-7892",
        reward: 15,
        status: "completed",
        createdAt: new Date(Date.now() - 3 * 864e5).toISOString()
      },
      {
        id: "ref_002",
        referrerId: "usr_demo_101",
        referredUserId: "usr_ref_202",
        referredUsername: "Akosua_Crypto",
        referralCode: "CMX-7892",
        reward: 35,
        status: "completed",
        createdAt: new Date(Date.now() - 1 * 864e5).toISOString()
      }
    ];
    this.chatMessages = [
      {
        id: "chat_001",
        username: "Kwame",
        text: "Just received GHS 350.00 directly to my MTN MoMo! CloudMineX pays fast \u{1F525}",
        badge: "Verified Payout",
        type: "payout",
        createdAt: new Date(Date.now() - 30 * 6e4).toISOString()
      },
      {
        id: "chat_002",
        username: "Abena",
        text: "Deposited GHS 300 via Telecel Cash and activated Basic Miner rig! Daily yield GHS 18.00 received today \u{1F680}",
        badge: "Active Miner",
        type: "deposit",
        createdAt: new Date(Date.now() - 22 * 6e4).toISOString()
      },
      {
        id: "chat_003",
        username: "Kofi",
        text: "Welcome bonus GHS 50 activated after my first deposit! Best cloud mining platform in Ghana",
        badge: "VIP Member",
        type: "chat",
        createdAt: new Date(Date.now() - 15 * 6e4).toISOString()
      },
      {
        id: "chat_004",
        username: "Rita",
        text: "Withdrawal of GHS 700.00 confirmed in 3 minutes! Thanks CloudMineX admin!",
        badge: "Verified Payout",
        type: "payout",
        createdAt: new Date(Date.now() - 8 * 6e4).toISOString()
      },
      {
        id: "chat_005",
        username: "Yaw",
        text: "Started Pro Miner plan GHS 700! Estimated daily GHS 49.00 incoming everyday",
        badge: "Pro Miner",
        type: "deposit",
        createdAt: new Date(Date.now() - 2 * 6e4).toISOString()
      },
      {
        id: "chat_006",
        username: "Belinda",
        text: "GHS 450 payout received on my MoMo account! Thanks CloudMineX team \u{1F64F}",
        badge: "Verified Payout",
        type: "payout",
        createdAt: new Date(Date.now() - 1 * 6e4).toISOString()
      },
      {
        id: "chat_007",
        username: "Bob",
        text: "My GHS 50 welcome bonus plus daily earnings cashed out right after my first GHS 100 recharge!",
        badge: "Active Miner",
        type: "payout",
        createdAt: new Date(Date.now() - 30 * 1e3).toISOString()
      }
    ];
    this.saveData();
  }
};
var db = new DBStore();

// server/services/rewardEngine.ts
init_dbMongo();
function processMiningYields(targetUserId) {
  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1e3;
  const activeContracts = targetUserId ? db.miningContracts.filter((c) => c.userId === targetUserId && c.status === "active") : db.miningContracts.filter((c) => c.status === "active");
  let creditedTotal = 0;
  let contractsUpdated = 0;
  let contractsCompleted = 0;
  let hasDbChanges = false;
  const updatedUserIds = /* @__PURE__ */ new Set();
  const updatedContracts = [];
  const createdTransactions = [];
  for (const contract of activeContracts) {
    const user = db.users.find((u) => u.id === contract.userId);
    if (!user) continue;
    const startMs = new Date(contract.startDate || contract.createdAt).getTime();
    const endMs = new Date(contract.endDate).getTime();
    const maxDays = contract.duration || 14;
    const dailyReward = contract.estimatedDailyReward || Number((contract.amount * (contract.rewardRate || 0.06)).toFixed(2));
    const elapsedTotalMs = Math.max(0, now - startMs);
    const totalDaysPassed = Math.floor(elapsedTotalMs / ONE_DAY_MS);
    const alreadyCreditedDays = Math.min(maxDays, Math.floor(((contract.accumulatedReward || 0) + 1e-4) / (dailyReward || 1)));
    const targetDaysCredited = Math.min(totalDaysPassed, maxDays);
    const actualDaysToCredit = Math.max(0, targetDaysCredited - alreadyCreditedDays);
    if (actualDaysToCredit > 0) {
      const rewardToAdd = Number((actualDaysToCredit * dailyReward).toFixed(2));
      contract.accumulatedReward = Number(((contract.accumulatedReward || 0) + rewardToAdd).toFixed(2));
      contract.lastCalculatedAt = new Date(startMs + (alreadyCreditedDays + actualDaysToCredit) * ONE_DAY_MS).toISOString();
      contract.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      user.balance = Number((user.balance + rewardToAdd).toFixed(2));
      user.totalRewards = Number(((user.totalRewards || 0) + rewardToAdd).toFixed(2));
      user.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      creditedTotal += rewardToAdd;
      contractsUpdated++;
      hasDbChanges = true;
      updatedUserIds.add(user.id);
      updatedContracts.push(contract);
      for (let dayIndex = 1; dayIndex <= actualDaysToCredit; dayIndex++) {
        const txTime = new Date(startMs + (alreadyCreditedDays + dayIndex) * ONE_DAY_MS).toISOString();
        const newTx = {
          id: `tx_yield_${Date.now()}_${Math.floor(Math.random() * 1e3)}_${dayIndex}`,
          userId: user.id,
          type: "mining_reward",
          amount: dailyReward,
          currency: user.currency || "GHS",
          reference: `YIELD-${contract.id.slice(-4)}-${Date.now().toString().slice(-4)}`,
          description: `24h Daily Yield - ${contract.planName} (Day ${alreadyCreditedDays + dayIndex}/${maxDays})`,
          status: "completed",
          createdAt: txTime
        };
        db.transactions.unshift(newTx);
        createdTransactions.push(newTx);
      }
    }
    const isMatured = now >= endMs || (contract.accumulatedReward || 0) >= (contract.estimatedTotalReward || dailyReward * maxDays);
    if (isMatured && contract.status === "active") {
      contract.status = "completed";
      contract.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      if (user.activeContracts && user.activeContracts > 0) {
        user.activeContracts -= 1;
      }
      contractsCompleted++;
      hasDbChanges = true;
      updatedUserIds.add(user.id);
      if (!updatedContracts.includes(contract)) {
        updatedContracts.push(contract);
      }
      const matureTx = {
        id: `tx_mature_${Date.now()}_${Math.floor(Math.random() * 1e3)}`,
        userId: user.id,
        type: "mining_reward",
        amount: 0,
        currency: user.currency || "GHS",
        reference: `MATURE-${contract.id.slice(-4)}`,
        description: `Contract Matured: ${contract.planName} (${maxDays} Days Full Cycle Completed)`,
        status: "completed",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      db.transactions.unshift(matureTx);
      createdTransactions.push(matureTx);
    }
  }
  if (hasDbChanges) {
    db.saveData();
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
                updatedAt: u.updatedAt
              }
            }
          ).catch((e) => console.error("[MongoDB] Mining yield user sync error:", e));
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
              updatedAt: cntr.updatedAt
            }
          }
        ).catch((e) => console.error("[MongoDB] Mining yield contract sync error:", e));
      }
      for (const tx of createdTransactions) {
        TransactionModel.create(tx).catch((e) => console.error("[MongoDB] Mining yield tx sync error:", e));
      }
    }
  }
  return { creditedTotal, contractsUpdated, contractsCompleted };
}

// server/services/cryptoPriceService.ts
var CURRENT_RATES = {
  BTC: 1425e3,
  // 1 BTC ~ GHS 1,425,000
  ETH: 51200,
  // 1 ETH ~ GHS 51,200
  USDT: 15.5,
  // 1 USDT ~ GHS 15.50
  GHS_USD: 15.5
};
var cachedTickers = [
  { symbol: "BTC", name: "Bitcoin", price: 91420.5, change: "+2.85%", high: 92100, low: 88900, volume: "34.2B" },
  { symbol: "ETH", name: "Ethereum", price: 3410.2, change: "+1.42%", high: 3490, low: 3340, volume: "18.7B" },
  { symbol: "USDT", name: "Tether USD", price: 1, change: "+0.01%", high: 1.001, low: 0.999, volume: "58.4B" },
  { symbol: "SOL", name: "Solana", price: 184.6, change: "+4.12%", high: 189.5, low: 176.2, volume: "8.9B" },
  { symbol: "BNB", name: "BNB Chain", price: 592.1, change: "-0.38%", high: 601, low: 588, volume: "3.1B" },
  { symbol: "XRP", name: "Ripple", price: 0.584, change: "+0.95%", high: 0.598, low: 0.575, volume: "2.4B" }
];
var lastTickerUpdate = 0;
function getMarketTickers() {
  const now = Date.now();
  if (now - lastTickerUpdate > 3e3) {
    lastTickerUpdate = now;
    cachedTickers = cachedTickers.map((t) => {
      const deltaPercent = (Math.random() - 0.49) * 4e-3;
      const newPrice = +(t.price * (1 + deltaPercent)).toFixed(t.price < 2 ? 4 : 2);
      const isUp = deltaPercent >= 0;
      return {
        ...t,
        price: newPrice,
        change: `${isUp ? "+" : ""}${(deltaPercent * 100).toFixed(2)}%`,
        high: Math.max(t.high, newPrice),
        low: Math.min(t.low, newPrice)
      };
    });
  }
  return cachedTickers;
}
function getCryptoRates() {
  return CURRENT_RATES;
}
function convertFiatToCrypto(fiatAmountGHS, currency) {
  const rates = getCryptoRates();
  const rate = rates[currency] || 15.5;
  let cryptoAmount = fiatAmountGHS / rate;
  if (currency === "BTC") {
    cryptoAmount = Number(cryptoAmount.toFixed(8));
  } else if (currency === "ETH") {
    cryptoAmount = Number(cryptoAmount.toFixed(6));
  } else {
    cryptoAmount = Number(cryptoAmount.toFixed(2));
  }
  return { cryptoAmount, rate };
}

// server/services/payment/mobileMoneyProvider.ts
var MobileMoneyProvider = class {
  async createDeposit(req) {
    const reference = req.reference || `MOMO-${Date.now()}-${Math.floor(1e3 + Math.random() * 9e3)}`;
    const providerLower = req.provider.toLowerCase();
    let merchantName = "Vodafone Cash";
    let merchantNumber = "0202496815";
    let accountName = "Charles Asumah";
    let walletType = "Vodafone Cash";
    let instructions = "Send your GHS payment via Vodafone Cash / Mobile Money and include the payment reference below for faster verification.";
    if (providerLower.includes("telecel")) {
      merchantName = db.settings.telecelMerchantName;
      merchantNumber = db.settings.telecelMerchantNumber;
      accountName = "CloudMineX Telecel Cash";
      walletType = "Telecel Cash";
      instructions = "Send your GHS payment via Telecel Cash and include the payment reference below for faster verification.";
    } else if (providerLower.includes("at")) {
      merchantName = db.settings.atMerchantName;
      merchantNumber = db.settings.atMerchantNumber;
      accountName = "CloudMineX AT Money";
      walletType = "AT Money";
      instructions = "Send your GHS payment via AT Money and include the payment reference below for faster verification.";
    } else if (providerLower.includes("mtn")) {
      merchantName = db.settings.mtnMerchantName;
      merchantNumber = db.settings.mtnMerchantNumber;
      accountName = "CloudMineX Ghana MoMo";
      walletType = "MTN MoMo";
      instructions = "Send your GHS payment via MTN MoMo and include the payment reference below for faster verification.";
    }
    return {
      success: true,
      reference,
      provider: req.provider,
      amount: req.amount,
      merchantName,
      merchantNumber,
      accountName,
      walletType,
      instructions,
      status: "pending",
      message: instructions,
      isDemo: true
    };
  }
  async checkStatus(reference) {
    const deposit = db.deposits.find((d) => d.reference === reference);
    if (!deposit) {
      return {
        success: false,
        reference,
        provider: "Mobile Money",
        amount: 0,
        status: "failed",
        message: "Deposit reference not found",
        isDemo: true
      };
    }
    return {
      success: true,
      reference: deposit.reference,
      provider: deposit.provider,
      amount: deposit.amount,
      status: deposit.status,
      message: `Payment status: ${deposit.status}`,
      isDemo: true
    };
  }
};
var mobileMoneyProvider = new MobileMoneyProvider();

// server/services/payment/cryptoProvider.ts
var CryptoProvider = class {
  async createDeposit(req) {
    const reference = req.reference || `CRYPTO-${Date.now()}-${Math.floor(1e3 + Math.random() * 9e3)}`;
    const currency = (req.currency || "USDT").toUpperCase();
    const network = req.network || (currency === "USDT" ? "TRC-20" : currency === "BTC" ? "Bitcoin" : "Ethereum Mainnet");
    let depositAddress = db.settings.usdtTrc20Address;
    if (currency === "BTC") {
      depositAddress = db.settings.btcAddress;
    } else if (currency === "ETH") {
      depositAddress = db.settings.ethAddress;
    } else if (currency === "USDT") {
      if (network === "ERC-20") depositAddress = db.settings.usdtErc20Address;
      else if (network === "BEP-20") depositAddress = db.settings.usdtBep20Address;
      else depositAddress = db.settings.usdtTrc20Address;
    }
    const { cryptoAmount } = convertFiatToCrypto(req.amount, currency);
    return {
      success: true,
      reference,
      provider: `Crypto (${currency} ${network})`,
      amount: req.amount,
      cryptoAmount,
      depositAddress,
      status: "pending",
      message: `Deposit address generated for ${currency} on ${network} network.`,
      isDemo: true
    };
  }
  async checkStatus(reference) {
    const deposit = db.deposits.find((d) => d.reference === reference);
    if (!deposit) {
      return {
        success: false,
        reference,
        provider: "Crypto",
        amount: 0,
        status: "failed",
        message: "Deposit reference not found",
        isDemo: true
      };
    }
    return {
      success: true,
      reference: deposit.reference,
      provider: deposit.provider,
      amount: deposit.amount,
      cryptoAmount: deposit.cryptoAmount,
      depositAddress: deposit.address,
      status: deposit.status,
      message: `Crypto deposit status: ${deposit.status}`,
      isDemo: true
    };
  }
};
var cryptoProvider = new CryptoProvider();

// server/services/emailService.ts
import nodemailer from "nodemailer";
async function sendPasswordResetEmail(toEmail, username, otpCode) {
  const host = (process.env.SMTP_HOST || "smtp-relay.brevo.com").trim();
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = (process.env.SMTP_USER || "b66df9001@smtp-brevo.com").trim();
  let pass = (process.env.SMTP_PASS || "").trim();
  const sender = (process.env.SENDER_EMAIL || "cloudminexsupport@gmail.com").trim();
  if (pass.startsWith("xsmtpsib-xsmtpsib-")) {
    pass = pass.replace("xsmtpsib-xsmtpsib-", "xsmtpsib-");
  }
  console.log(`[EmailService] Preparing to send 6-digit OTP to ${toEmail} using SMTP host: ${host}:${port}, user: ${user}`);
  if (!pass) {
    console.warn("[EmailService] Warning: SMTP_PASS is empty. Email sending might fail unless configured.");
  }
  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      // true for 465, false for other ports
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    const mailOptions = {
      from: `"CloudMineX Security" <${sender}>`,
      to: toEmail,
      subject: `CloudMineX - Password Reset Verification Code: ${otpCode}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #07111F; color: #FFFFFF; margin: 0; padding: 20px; }
            .container { max-width: 520px; margin: 0 auto; background: #0D1B2A; border-radius: 16px; border: 1px solid #10253A; padding: 32px; box-shadow: 0 10px 30px rgba(0, 212, 168, 0.08); }
            .header { text-align: center; margin-bottom: 24px; }
            .logo { font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #FFFFFF; }
            .logo-highlight { color: #00D4A8; }
            .badge { display: inline-block; background: rgba(0, 212, 168, 0.1); border: 1px solid rgba(0, 212, 168, 0.3); color: #00D4A8; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; margin-top: 8px; }
            .content { text-align: center; }
            h2 { color: #FFFFFF; font-size: 20px; margin-bottom: 12px; }
            p { color: #94A3B8; font-size: 14px; line-height: 1.6; margin-bottom: 20px; }
            .otp-box { background: #07111F; border: 2px dashed #00D4A8; border-radius: 12px; padding: 18px; margin: 24px 0; text-align: center; }
            .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #00D4A8; font-family: monospace; }
            .expiry-note { font-size: 12px; color: #94A3B8; margin-top: 8px; }
            .security-warning { background: rgba(255, 170, 0, 0.08); border-left: 3px solid #FFAA00; padding: 12px; text-align: left; border-radius: 6px; font-size: 12px; color: #E2E8F0; margin-top: 24px; }
            .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #64748B; border-top: 1px solid #10253A; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">CloudMine<span class="logo-highlight">X</span></div>
              <div class="badge">Security Verification</div>
            </div>
            <div class="content">
              <h2>Password Reset Request</h2>
              <p>Hello <strong style="color: #FFFFFF;">${username}</strong>,</p>
              <p>We received a request to reset your CloudMineX account password. Use the 6-digit verification code below to authorize the update:</p>
              
              <div class="otp-box">
                <div class="otp-code">${otpCode}</div>
                <div class="expiry-note">\u23F1\uFE0F Code valid for 10 minutes</div>
              </div>

              <p>If you did not request this password reset, please ignore this email or reach out to support immediately.</p>

              <div class="security-warning">
                \u{1F512} <strong>Security Tip:</strong> Never share your verification code or password with anyone. CloudMineX representatives will never ask for your code.
              </div>
            </div>
            <div class="footer">
              &copy; ${(/* @__PURE__ */ new Date()).getFullYear()} CloudMineX Protocol. Automated Cloud Mining Infrastructure.
            </div>
          </div>
        </body>
        </html>
      `
    };
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] OTP email successfully sent to ${toEmail}. MessageId: ${info.messageId}`);
    return {
      success: true,
      message: `A 6-digit verification code has been sent to ${toEmail}.`
    };
  } catch (error) {
    console.error("[EmailService] Error sending email via SMTP:", error);
    return {
      success: false,
      message: `Failed to send email via SMTP (${error.message || "Connection error"}). Please check SMTP configuration.`
    };
  }
}

// server/routes/api.ts
init_dbMongo();
var apiRouter = Router();
var AFFILIATE_MILESTONES = [
  {
    id: "bronze",
    level: 1,
    name: "BRONZE",
    title: "Bronze Affiliate",
    requiredRefs: 1,
    perk: "10% First Deposit Comm",
    rewardText: "$5 Cash Bonus",
    rewardUsd: 5,
    rewardGhs: 75,
    extraComm: 0.1,
    // 10% First Deposit Comm
    color: "#D97706"
  },
  {
    id: "silver",
    level: 2,
    name: "SILVER",
    title: "Silver Ambassador",
    requiredRefs: 5,
    perk: "Priority Support & Fast Withdrawals",
    rewardText: "$25 Instant Bonus + 1% Extra Comm",
    rewardUsd: 25,
    rewardGhs: 375,
    extraComm: 0.11,
    // 10% + 1% = 11%
    color: "#94A3B8"
  },
  {
    id: "gold",
    level: 3,
    name: "GOLD",
    title: "Gold Partner",
    requiredRefs: 12,
    perk: "Custom Referral Link & Manager",
    rewardText: "$50 VIP Partner Reward",
    rewardUsd: 50,
    rewardGhs: 750,
    extraComm: 0.11,
    color: "#EAB308"
  },
  {
    id: "platinum",
    level: 4,
    name: "PLATINUM",
    title: "Platinum Director",
    requiredRefs: 25,
    perk: "0% Withdrawal Fees & Exclusive Webinars",
    rewardText: "$100 Executive Cash Pool",
    rewardUsd: 100,
    rewardGhs: 1500,
    extraComm: 0.12,
    color: "#2DD4FF"
  },
  {
    id: "diamond",
    level: 5,
    name: "DIAMOND",
    title: "Diamond Legend",
    requiredRefs: 50,
    perk: "VIP Regional Ambassador Status",
    rewardText: "$200 Global Profit Share",
    rewardUsd: 200,
    rewardGhs: 3e3,
    extraComm: 0.13,
    color: "#A855F7"
  }
];
var getFundedReferralsCount = (userId) => {
  const referredUsers = db.users.filter((u) => u.referredBy === userId);
  const userRefs = db.referrals.filter((r) => r.referrerId === userId);
  const allReferredIds = /* @__PURE__ */ new Set();
  referredUsers.forEach((u) => allReferredIds.add(u.id));
  userRefs.forEach((r) => {
    if (r.referredUserId) allReferredIds.add(r.referredUserId);
  });
  let fundedCount = 0;
  allReferredIds.forEach((referredId) => {
    const userObj = db.users.find((u) => u.id === referredId);
    const confirmedDeps = db.deposits.filter((d) => d.userId === referredId && d.status === "confirmed");
    const isFunded = userObj && (userObj.totalDeposits || 0) > 0 || confirmedDeps.length > 0;
    if (isFunded) {
      fundedCount++;
    }
  });
  return fundedCount;
};
var isFirstConfirmedDeposit = (userId, currentDepositId) => {
  return db.deposits.filter(
    (d) => d.userId === userId && d.status === "confirmed" && d.id !== currentDepositId
  ).length === 0;
};
var creditReferralBonus = (user, deposit) => {
  if (!user.referredBy) return;
  const referrer = db.users.find((u) => u.id === user.referredBy);
  if (!referrer) return;
  if (!isFirstConfirmedDeposit(user.id, deposit.id)) return;
  const referrerFundedCount = getFundedReferralsCount(referrer.id);
  let commRate = 0.1;
  if (referrerFundedCount >= 50) commRate = 0.13;
  else if (referrerFundedCount >= 25) commRate = 0.12;
  else if (referrerFundedCount >= 5) commRate = 0.11;
  const bonusAmount = Number((deposit.amount * commRate).toFixed(2));
  referrer.balance = Number((referrer.balance + bonusAmount).toFixed(2));
  referrer.totalRewards = Number(((referrer.totalRewards || 0) + bonusAmount).toFixed(2));
  referrer.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  const refRecord = db.referrals.find((r) => r.referredUserId === user.id);
  if (refRecord) {
    refRecord.reward = Number((refRecord.reward + bonusAmount).toFixed(2));
    refRecord.status = "funded";
  }
  db.transactions.unshift({
    id: `tx_ref_bonus_${Date.now()}`,
    userId: referrer.id,
    type: "deposit",
    amount: bonusAmount,
    currency: referrer.currency || "GHS",
    reference: `REF-BONUS-${user.username.toUpperCase()}`,
    description: `${(commRate * 100).toFixed(0)}% First Deposit Referral Commission from ${user.username}`,
    status: "completed",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
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
            updatedAt: referrer.updatedAt
          }
        }
      ).catch((e) => console.error("[MongoDB] Referral commission sync error:", e));
    } catch (e) {
      console.error("[MongoDB] Referrer update error:", e);
    }
  }
};
function findUserByQuery(rawQuery) {
  if (!rawQuery) return null;
  const clean = rawQuery.trim();
  const lower = clean.toLowerCase();
  const digitsOnly = clean.replace(/\D/g, "");
  let user = db.users.find(
    (u) => u.username && u.username.toLowerCase() === lower || u.email && u.email.toLowerCase() === lower || u.phone && u.phone.trim() === clean
  );
  if (user) return user;
  if (digitsOnly && digitsOnly.length >= 7) {
    user = db.users.find(
      (u) => u.phone && u.phone.replace(/\D/g, "").endsWith(digitsOnly.slice(-9))
    );
    if (user) return user;
  }
  if (lower.includes("@")) {
    const prefix = lower.split("@")[0].trim();
    user = db.users.find(
      (u) => u.username && u.username.toLowerCase() === prefix || u.email && u.email.split("@")[0].toLowerCase() === prefix
    );
    if (user) return user;
  }
  user = db.users.find(
    (u) => u.email && (u.email.toLowerCase() === `${lower}@cloudminex.io` || u.email.toLowerCase() === `${lower}@gmail.com` || u.email.split("@")[0].toLowerCase() === lower)
  );
  return user || null;
}
async function findUserLive(rawQuery) {
  if (!rawQuery) return null;
  const clean = rawQuery.trim();
  const lower = clean.toLowerCase();
  const digitsOnly = clean.replace(/\D/g, "");
  if (isMongoConnected()) {
    try {
      const safeEscaped = clean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const conditions = [
        { username: new RegExp("^" + safeEscaped + "$", "i") },
        { email: new RegExp("^" + safeEscaped + "$", "i") },
        { phone: clean }
      ];
      if (digitsOnly && digitsOnly.length >= 7) {
        conditions.push({ phone: new RegExp(digitsOnly.slice(-9) + "$") });
      }
      if (lower.includes("@")) {
        const prefix = lower.split("@")[0].trim();
        const prefixEscaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        conditions.push({ username: new RegExp("^" + prefixEscaped + "$", "i") });
      }
      const mongoDoc = await UserModel.findOne({ $or: conditions }).lean();
      if (mongoDoc) {
        const userObj = {
          id: mongoDoc.id,
          username: mongoDoc.username,
          email: mongoDoc.email,
          phone: mongoDoc.phone,
          password: mongoDoc.password,
          paymentMethod: mongoDoc.paymentMethod,
          paymentAddress: mongoDoc.paymentAddress,
          balance: mongoDoc.balance || 0,
          totalDeposits: mongoDoc.totalDeposits || 0,
          currency: mongoDoc.currency || "GHS",
          referralCode: mongoDoc.referralCode || mongoDoc.username,
          referredBy: mongoDoc.referredBy || null,
          vipLevel: mongoDoc.vipLevel || 1,
          vipTier: mongoDoc.vipTier || "Bronze VIP",
          totalRewards: mongoDoc.totalRewards || 0,
          activeContracts: mongoDoc.activeContracts || 0,
          createdAt: mongoDoc.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: mongoDoc.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
        };
        const idx = db.users.findIndex((u) => u.id === userObj.id);
        if (idx >= 0) {
          db.users[idx] = userObj;
        } else {
          db.users.push(userObj);
        }
        return userObj;
      } else {
        const hadInCache = db.users.some(
          (u) => u.username.toLowerCase() === lower || u.email && u.email.toLowerCase() === lower || u.phone === clean
        );
        if (hadInCache) {
          db.users = db.users.filter(
            (u) => u.username.toLowerCase() !== lower && (u.email ? u.email.toLowerCase() !== lower : true) && u.phone !== clean
          );
          db.saveData();
        }
        return null;
      }
    } catch (err) {
      console.warn("[MongoDB] Live query error, checking memory cache:", err.message);
    }
  }
  return findUserByQuery(rawQuery);
}
apiRouter.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username) {
    return res.status(400).json({ success: false, message: "Username, email, or phone number is required." });
  }
  const user = await findUserLive(username);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Account not found. Please register first to create an account."
    });
  }
  if (user.password && password && user.password !== password) {
    return res.status(401).json({
      success: false,
      message: 'Incorrect password. Please verify or use "Forgot Password" to reset.'
    });
  }
  if (!user.password && password) {
    user.password = password.trim();
    user.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    db.saveData();
    if (isMongoConnected()) {
      try {
        await UserModel.updateOne({ id: user.id }, { $set: { password: user.password, updatedAt: user.updatedAt } });
      } catch (e) {
      }
    }
  }
  res.json({
    success: true,
    message: `Welcome back, ${user.username}!`,
    user
  });
});
apiRouter.post("/auth/register", async (req, res) => {
  try {
    const { username, phone, email, password, referralCode, paymentMethod, paymentAddress } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ success: false, message: "Username is required." });
    }
    const cleanUsername = username.trim();
    const cleanEmail = email ? email.trim().toLowerCase() : "";
    const existingUser = await findUserLive(cleanUsername) || (cleanEmail ? await findUserLive(cleanEmail) : null);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `An account with username "${cleanUsername}" or email "${cleanEmail}" already exists. Please log in with your password, or use the "Reset" tab to set a new password.`
      });
    }
    let referrer = null;
    if (referralCode && typeof referralCode === "string" && referralCode.trim()) {
      const codeTrimmed = referralCode.trim().toLowerCase();
      referrer = await findUserLive(codeTrimmed);
      if (!referrer) {
        referrer = db.users.find(
          (u) => u.username && u.username.toLowerCase() === codeTrimmed || u.referralCode && u.referralCode.toLowerCase() === codeTrimmed
        );
      }
    }
    const newUser = {
      id: `usr_${Date.now()}`,
      username: cleanUsername,
      email: cleanEmail || `${cleanUsername.toLowerCase()}@cloudminex.io`,
      phone: phone ? phone.trim() : "+233 24 000 0000",
      password: password ? password.trim() : void 0,
      paymentMethod: paymentMethod || "Mobile Payments",
      paymentAddress: paymentAddress || phone || "Not specified",
      balance: 50,
      // Welcome signup bonus
      totalDeposits: 0,
      currency: "GHS",
      activeContracts: 0,
      totalRewards: 0,
      referralCode: cleanUsername,
      // Use username as referral code parameter
      referredBy: referrer ? referrer.id : null,
      vipLevel: 1,
      vipTier: "Bronze VIP",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.users.push(newUser);
    if (referrer) {
      db.referrals.push({
        id: `ref_${Date.now()}_${Math.floor(Math.random() * 1e3)}`,
        referrerId: referrer.id,
        referredUserId: newUser.id,
        referredUsername: newUser.username,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        reward: 0,
        // Rewarded upon deposit
        status: "pending"
        // Pending deposit
      });
    }
    db.transactions.unshift({
      id: `tx_welcome_${Date.now()}`,
      userId: newUser.id,
      type: "deposit",
      amount: 50,
      currency: "GHS",
      reference: `WELCOME-BONUS-${newUser.id.slice(-4)}`,
      description: "Welcome Bonus Credit",
      status: "completed",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    db.saveData();
    if (isMongoConnected()) {
      try {
        await UserModel.create(newUser);
        console.log(`[MongoDB] Created new user document for "${newUser.username}" in MongoDB!`);
      } catch (mErr) {
        console.warn("[MongoDB] MongoDB creation note:", mErr.message);
      }
    }
    return res.json({
      success: true,
      message: "Account created successfully! Enjoy your GHS 50 welcome credit.",
      user: newUser
    });
  } catch (error) {
    console.error("[Auth] Registration error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "An error occurred during registration. Please try again."
    });
  }
});
apiRouter.post("/auth/forgot-password", async (req, res) => {
  const { emailOrUsername } = req.body;
  if (!emailOrUsername || !emailOrUsername.trim()) {
    return res.status(400).json({
      success: false,
      message: "Please enter your registered email, username, or phone number."
    });
  }
  const query = emailOrUsername.trim();
  const user = await findUserLive(query);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: `No account found for "${query}". Please check your spelling or register a new account.`
    });
  }
  if (query.includes("@") && query.includes(".")) {
    user.email = query.toLowerCase();
    user.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    db.saveData();
    if (isMongoConnected()) {
      try {
        await UserModel.updateOne({ id: user.id }, { $set: { email: user.email, updatedAt: user.updatedAt } });
      } catch (e) {
      }
    }
  }
  let targetEmail = user.email;
  if (!targetEmail || !targetEmail.includes("@") || targetEmail.endsWith("@cloudminex.io")) {
    if (query.includes("@")) {
      targetEmail = query.toLowerCase();
      user.email = targetEmail;
      db.saveData();
      if (isMongoConnected()) {
        try {
          await UserModel.updateOne({ id: user.id }, { $set: { email: user.email, updatedAt: user.updatedAt } });
        } catch (e) {
        }
      }
    } else {
      targetEmail = `${user.username.toLowerCase()}@gmail.com`;
    }
  }
  const otpCode = Math.floor(1e5 + Math.random() * 9e5).toString();
  const expiresAt = Date.now() + 10 * 60 * 1e3;
  db.passwordResetOtps = db.passwordResetOtps.filter(
    (o) => o.emailOrUsername.toLowerCase() !== user.username.toLowerCase() && o.emailOrUsername.toLowerCase() !== (user.email || "").toLowerCase() && o.emailOrUsername.toLowerCase() !== query.toLowerCase() && o.expiresAt > Date.now()
  );
  db.passwordResetOtps.push({
    emailOrUsername: targetEmail.toLowerCase(),
    code: otpCode,
    expiresAt
  });
  db.passwordResetOtps.push({
    emailOrUsername: user.username.toLowerCase(),
    code: otpCode,
    expiresAt
  });
  if (query.toLowerCase() !== targetEmail.toLowerCase() && query.toLowerCase() !== user.username.toLowerCase()) {
    db.passwordResetOtps.push({
      emailOrUsername: query.toLowerCase(),
      code: otpCode,
      expiresAt
    });
  }
  console.log(`[Auth] Generated 6-digit OTP code for ${user.username} (${targetEmail}): ${otpCode}`);
  const emailResult = await sendPasswordResetEmail(targetEmail, user.username, otpCode);
  res.json({
    success: true,
    message: emailResult.success ? `A 6-digit verification code has been sent to ${targetEmail}. Please check your inbox or spam.` : `Verification code generated: ${otpCode} (SMTP: ${emailResult.message})`,
    email: targetEmail,
    username: user.username,
    otpSent: emailResult.success,
    code: !emailResult.success ? otpCode : void 0
    // Dev fallback if SMTP fails
  });
});
apiRouter.post("/auth/verify-otp", async (req, res) => {
  const { emailOrUsername, code } = req.body;
  if (!emailOrUsername || !code) {
    return res.status(400).json({
      success: false,
      message: "Email/username and 6-digit code are required."
    });
  }
  const cleanCode = code.toString().trim();
  const query = emailOrUsername.trim().toLowerCase();
  const user = await findUserLive(emailOrUsername);
  const validOtp = db.passwordResetOtps.find(
    (o) => (o.emailOrUsername.toLowerCase() === query || user && (o.emailOrUsername.toLowerCase() === user.username.toLowerCase() || user.email && o.emailOrUsername.toLowerCase() === user.email.toLowerCase())) && o.code === cleanCode && o.expiresAt > Date.now()
  );
  if (!validOtp) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired 6-digit verification code. Please check or request a new code."
    });
  }
  res.json({
    success: true,
    message: "Verification code confirmed. You may now enter your new password."
  });
});
apiRouter.post("/auth/reset-password", async (req, res) => {
  const { emailOrUsername, code, newPassword } = req.body;
  if (!emailOrUsername || !code || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Email/username, 6-digit code, and new password are required."
    });
  }
  if (newPassword.length < 4) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 4 characters long."
    });
  }
  const cleanCode = code.toString().trim();
  const query = emailOrUsername.trim().toLowerCase();
  const user = await findUserLive(emailOrUsername);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Account not found."
    });
  }
  const validOtpIndex = db.passwordResetOtps.findIndex(
    (o) => (o.emailOrUsername.toLowerCase() === query || o.emailOrUsername.toLowerCase() === user.username.toLowerCase() || user.email && o.emailOrUsername.toLowerCase() === user.email.toLowerCase()) && o.code === cleanCode && o.expiresAt > Date.now()
  );
  if (validOtpIndex === -1) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired verification code. Please request a new 6-digit code."
    });
  }
  user.password = newPassword.trim();
  if (query.includes("@") && query.includes(".")) {
    user.email = query.toLowerCase();
  }
  user.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  db.passwordResetOtps.splice(validOtpIndex, 1);
  db.saveData();
  if (isMongoConnected()) {
    try {
      await UserModel.updateOne(
        { id: user.id },
        { $set: { password: user.password, email: user.email, updatedAt: user.updatedAt } }
      );
      console.log(`[MongoDB] Password updated directly in MongoDB Atlas for user ${user.username}`);
    } catch (e) {
      console.warn("[MongoDB] Mongo password update error:", e.message);
    }
  }
  res.json({
    success: true,
    message: "Password updated successfully! You are now logged in.",
    user
  });
});
apiRouter.post("/auth/update-password", async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;
  if (!userId || !newPassword) {
    return res.status(400).json({ success: false, message: "User ID and new password are required." });
  }
  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }
  if (user.password && currentPassword && user.password !== currentPassword) {
    return res.status(400).json({ success: false, message: "Current password is incorrect." });
  }
  user.password = newPassword.trim();
  user.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  db.saveData();
  try {
    await UserModel.updateOne({ id: user.id }, { $set: { password: user.password, updatedAt: user.updatedAt } });
  } catch (e) {
  }
  res.json({
    success: true,
    message: "Password updated successfully."
  });
});
apiRouter.get("/users/demo", (req, res) => {
  let demoUser = db.users.find((u) => u.username === "demoUser");
  if (!demoUser) {
    db.seedInitialData();
    demoUser = db.users[0];
  }
  res.json({ success: true, user: demoUser });
});
apiRouter.get("/users/:id", async (req, res) => {
  if (isMongoConnected()) {
    try {
      await db.syncFromMongo();
    } catch (e) {
    }
  }
  processMiningYields(req.params.id);
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  res.json({ success: true, user });
});
apiRouter.get("/sync/status", (req, res) => {
  res.json({
    success: true,
    mongoConnected: isMongoConnected(),
    cachedUsers: db.users.length,
    cachedPlans: db.miningPlans.length,
    cachedDeposits: db.deposits.length,
    cachedContracts: db.miningContracts.length
  });
});
apiRouter.post("/sync/refresh", async (req, res) => {
  if (isMongoConnected()) {
    await db.syncFromMongo();
    return res.json({
      success: true,
      message: "Successfully refreshed all data from MongoDB Atlas database.",
      userCount: db.users.length
    });
  }
  res.json({
    success: false,
    message: "MongoDB is not connected. Operating in local storage mode."
  });
});
apiRouter.get("/mining-plans", (req, res) => {
  res.json({ success: true, plans: db.miningPlans.filter((p) => p.active) });
});
apiRouter.get("/mining-plans/:id", (req, res) => {
  const plan = db.miningPlans.find((p) => p.id === req.params.id);
  if (!plan) {
    return res.status(404).json({ success: false, message: "Mining plan not found" });
  }
  res.json({ success: true, plan });
});
apiRouter.post("/mining/start", (req, res) => {
  const { userId, planId } = req.body;
  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  const plan = db.miningPlans.find((p) => p.id === planId && p.active);
  if (!plan) {
    return res.status(400).json({ success: false, message: "Mining plan not available or inactive" });
  }
  if (user.balance < plan.price) {
    return res.status(400).json({
      success: false,
      message: `Insufficient balance. Required GHS ${plan.price.toFixed(2)}, available GHS ${user.balance.toFixed(2)}. Please recharge first.`
    });
  }
  user.balance = Number((user.balance - plan.price).toFixed(2));
  user.activeContracts = (user.activeContracts || 0) + 1;
  user.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  const now = /* @__PURE__ */ new Date();
  const endDate = new Date(now.getTime() + plan.duration * 864e5).toISOString();
  const contract = {
    id: `cntr_${Date.now()}_${Math.floor(Math.random() * 1e3)}`,
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
    status: "active",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };
  db.miningContracts.push(contract);
  const tx = {
    id: `tx_p_${Date.now()}`,
    userId: user.id,
    type: "mining_purchase",
    amount: plan.price,
    currency: "GHS",
    reference: `PURCHASE-${plan.name.replace(/\s+/g, "-").toUpperCase()}-${Date.now().toString().slice(-4)}`,
    description: `Purchase ${plan.name} Contract (${plan.duration} Days)`,
    status: "completed",
    createdAt: now.toISOString()
  };
  db.transactions.unshift(tx);
  db.saveData();
  res.json({
    success: true,
    message: `Successfully activated ${plan.name}! Mining contract started.`,
    contract,
    user
  });
});
apiRouter.get("/mining/user/:userId", async (req, res) => {
  if (isMongoConnected()) {
    try {
      await db.syncFromMongo();
    } catch (e) {
    }
  }
  processMiningYields(req.params.userId);
  const contracts = db.miningContracts.filter((c) => c.userId === req.params.userId);
  res.json({ success: true, contracts });
});
apiRouter.get("/mining/:id", (req, res) => {
  const contract = db.miningContracts.find((c) => c.id === req.params.id);
  if (!contract) {
    return res.status(404).json({ success: false, message: "Mining contract not found" });
  }
  res.json({ success: true, contract });
});
apiRouter.post("/mining/tick-rewards", (req, res) => {
  const { userId } = req.body;
  const user = db.users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  const yieldResult = processMiningYields(userId);
  let forceTicked = 0;
  if (yieldResult.creditedTotal === 0) {
    const activeContracts = db.miningContracts.filter((c) => c.userId === userId && c.status === "active");
    activeContracts.forEach((cntr) => {
      const dailyReward = cntr.estimatedDailyReward;
      cntr.accumulatedReward = Number((cntr.accumulatedReward + dailyReward).toFixed(2));
      forceTicked += dailyReward;
      db.transactions.unshift({
        id: `tx_rw_${Date.now()}_${Math.floor(Math.random() * 100)}`,
        userId: user.id,
        type: "mining_reward",
        amount: dailyReward,
        currency: "GHS",
        reference: `RW-${cntr.id.slice(-4)}-${Date.now().toString().slice(-4)}`,
        description: `Daily Yield (24h Tick) - ${cntr.planName}`,
        status: "completed",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    });
    if (forceTicked > 0) {
      user.balance = Number((user.balance + forceTicked).toFixed(2));
      user.totalRewards = Number((user.totalRewards + forceTicked).toFixed(2));
      user.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      db.saveData();
    }
  }
  const totalCredited = yieldResult.creditedTotal > 0 ? yieldResult.creditedTotal : forceTicked;
  res.json({
    success: true,
    message: `${totalCredited.toFixed(2)} GHS 24h mining yield credited to balance!`,
    totalTickedReward: totalCredited,
    user
  });
});
apiRouter.get(["/market/ticker", "/market/tickers"], (req, res) => {
  const tickers = getMarketTickers();
  res.json({
    success: true,
    tickers,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
apiRouter.get("/crypto/currencies", (req, res) => {
  const rates = getCryptoRates();
  res.json({
    success: true,
    currencies: ["BTC", "ETH", "USDT"],
    rates,
    addresses: {
      BTC: db.settings.btcAddress,
      ETH: db.settings.ethAddress,
      USDT: {
        "TRC-20": db.settings.usdtTrc20Address,
        "ERC-20": db.settings.usdtErc20Address,
        "BEP-20": db.settings.usdtBep20Address
      }
    },
    notes: {
      BTC: 'Binance supports deposits from all BTC addresses (starting with "1", "3", "bc1p" and "bc1q")',
      ETH: "Please do not send validator rewards to your Binance deposit address, as they will not be credited and funds may be lost.",
      USDT: "Deposits via smart contracts are not supported with the exception of ETH via ERC20, Arbitrum & Optimism network or BNB via BSC network."
    },
    requiredConfirmations: {
      BTC: db.settings.confirmationsBtc,
      ETH: db.settings.confirmationsEth,
      USDT: db.settings.confirmationsUsdt
    }
  });
});
apiRouter.post("/deposits/mobile-money", async (req, res) => {
  const { userId, provider, amount } = req.body;
  if (!userId || !amount || Number(amount) < 100) {
    return res.status(400).json({ success: false, message: "Minimum deposit amount is GHS 100." });
  }
  const result = await mobileMoneyProvider.createDeposit({
    userId,
    amount: Number(amount),
    provider: provider || "MTN MoMo",
    currency: "GHS"
  });
  const deposit = {
    id: `dep_${Date.now()}`,
    userId,
    type: "mobile_money",
    provider: result.provider,
    currency: "GHS",
    amount: result.amount,
    reference: result.reference,
    status: "pending",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.deposits.unshift(deposit);
  db.saveData();
  res.json({
    success: true,
    deposit,
    paymentDetails: result
  });
});
apiRouter.post("/deposits/crypto", async (req, res) => {
  const { userId, currency, network, amountFiat } = req.body;
  if (!userId || !amountFiat || Number(amountFiat) < 100) {
    return res.status(400).json({ success: false, message: "Minimum deposit amount is GHS 100." });
  }
  const curr = (currency || "USDT").toUpperCase();
  const result = await cryptoProvider.createDeposit({
    userId,
    amount: Number(amountFiat),
    provider: `Crypto (${curr})`,
    currency: curr,
    network
  });
  const deposit = {
    id: `dep_cr_${Date.now()}`,
    userId,
    type: "crypto",
    provider: result.provider,
    currency: curr,
    network,
    amount: result.amount,
    cryptoAmount: result.cryptoAmount,
    address: result.depositAddress,
    reference: result.reference,
    status: "pending",
    confirmations: 0,
    requiredConfirmations: curr === "BTC" ? db.settings.confirmationsBtc : curr === "ETH" ? db.settings.confirmationsEth : db.settings.confirmationsUsdt,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.deposits.unshift(deposit);
  db.saveData();
  res.json({
    success: true,
    deposit,
    paymentDetails: result
  });
});
apiRouter.get("/deposits/:userId", (req, res) => {
  const userDeposits = db.deposits.filter((d) => d.userId === req.params.userId);
  res.json({ success: true, deposits: userDeposits });
});
apiRouter.post("/deposits/:id/confirm-demo", (req, res) => {
  const deposit = db.deposits.find((d) => d.id === req.params.id);
  if (!deposit) return res.status(404).json({ success: false, message: "Deposit not found" });
  if (deposit.status === "confirmed") {
    return res.status(400).json({ success: false, message: "Deposit already confirmed" });
  }
  deposit.status = "confirmed";
  deposit.confirmations = deposit.requiredConfirmations || 3;
  deposit.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  const user = db.users.find((u) => u.id === deposit.userId);
  if (user) {
    user.balance = Number((user.balance + deposit.amount).toFixed(2));
    user.totalDeposits = Number(((user.totalDeposits || 0) + deposit.amount).toFixed(2));
    user.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    db.transactions.unshift({
      id: `tx_dep_${Date.now()}`,
      userId: user.id,
      type: "deposit",
      amount: deposit.amount,
      currency: "GHS",
      reference: deposit.reference,
      description: `Deposit via ${deposit.provider}`,
      status: "completed",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    creditReferralBonus(user, deposit);
  }
  db.saveData();
  res.json({
    success: true,
    message: `Deposit confirmed! GHS ${deposit.amount.toFixed(2)} added to balance.`,
    deposit,
    user
  });
});
var handleWithdrawal = (req, res) => {
  const { userId, amount, destination, provider } = req.body;
  const numAmount = Number(amount);
  const user = db.users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  const confirmedDeposits = db.deposits.filter(
    (d) => d.userId === user.id && d.status === "confirmed"
  );
  if ((user.totalDeposits || 0) <= 0 && confirmedDeposits.length === 0) {
    return res.status(403).json({
      success: false,
      depositRequired: true,
      message: "First Deposit Required! To withdraw your earnings or GHS 50 Welcome Bonus, you must make at least 1 deposit (minimum GHS 100) to activate payout processing."
    });
  }
  if (!numAmount || numAmount <= 0) {
    return res.status(400).json({ success: false, message: "Enter a valid withdrawal amount" });
  }
  if (user.balance < numAmount) {
    return res.status(400).json({
      success: false,
      message: `Insufficient balance. Available: GHS ${user.balance.toFixed(2)}`
    });
  }
  user.balance = Number((user.balance - numAmount).toFixed(2));
  user.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  const ref = `WD-${Date.now().toString().slice(-6)}`;
  const withdrawal = {
    id: `wd_${Date.now()}`,
    userId: user.id,
    amount: numAmount,
    currency: "GHS",
    destination: destination || "Mobile Money Wallet",
    provider: provider || "Mobile Money",
    status: "pending",
    reference: ref,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.withdrawals.unshift(withdrawal);
  db.transactions.unshift({
    id: `tx_wd_${Date.now()}`,
    userId: user.id,
    type: "withdrawal",
    amount: numAmount,
    currency: "GHS",
    reference: ref,
    description: `Withdrawal request to ${destination}`,
    status: "pending",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  db.saveData();
  res.json({
    success: true,
    message: "Withdrawal request submitted successfully.",
    withdrawal,
    user
  });
};
apiRouter.post("/withdrawals/demo", handleWithdrawal);
apiRouter.post("/withdrawals/create", handleWithdrawal);
apiRouter.get("/withdrawals/:userId", (req, res) => {
  const userWds = db.withdrawals.filter((w) => w.userId === req.params.userId);
  res.json({ success: true, withdrawals: userWds });
});
apiRouter.get("/income/:userId", async (req, res) => {
  const userId = req.params.userId;
  if (isMongoConnected()) {
    try {
      await db.syncFromMongo();
    } catch (e) {
    }
  }
  processMiningYields(userId);
  const user = db.users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  const activeContracts = db.miningContracts.filter((c) => c.userId === userId && c.status === "active");
  const completedContracts = db.miningContracts.filter((c) => c.userId === userId && c.status === "completed");
  const userTxs = db.transactions.filter((t) => t.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
    transactions: userTxs
  });
});
apiRouter.get("/referrals/:userId", (req, res) => {
  const userId = req.params.userId;
  const user = db.users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  const referredUsers = db.users.filter((u) => u.referredBy === userId);
  const userRefs = db.referrals.filter((r) => r.referrerId === userId);
  const totalInvited = Math.max(referredUsers.length, userRefs.length);
  let fundedCount = 0;
  const enrichedTeamMembers = (referredUsers.length > 0 ? referredUsers : userRefs).map((m) => {
    const referredUserObj = db.users.find(
      (u) => u.id === (m.id || m.referredUserId) || u.username === (m.username || m.referredUsername)
    );
    const userDeposits = db.deposits.filter(
      (d) => d.userId === (referredUserObj ? referredUserObj.id : "") && d.status === "confirmed"
    );
    const depositTotal = userDeposits.reduce((sum, d) => sum + d.amount, 0);
    const isFunded = referredUserObj && (referredUserObj.totalDeposits || 0) > 0 || userDeposits.length > 0 || m.status === "funded";
    if (isFunded) {
      fundedCount++;
    }
    return {
      id: m.id || `ref_${m.referredUserId || Date.now()}`,
      referredUserId: referredUserObj ? referredUserObj.id : m.referredUserId || m.id,
      referredUsername: referredUserObj ? referredUserObj.username : m.referredUsername || m.username || "Miner",
      createdAt: m.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
      isFunded,
      totalDeposits: depositTotal || (referredUserObj ? referredUserObj.totalDeposits || 0 : 0),
      reward: m.reward || 0,
      status: isFunded ? "funded" : "pending_deposit"
    };
  });
  const claimedList = user.claimedMilestones || [];
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
      progressPercent: Math.min(100, Math.round(fundedCount / m.requiredRefs * 100))
    };
  });
  const unlockedCount = milestonesWithStatus.filter((m) => m.isUnlocked).length;
  let currentLevelTitle = "Starter Level";
  if (unlockedCount === 5) currentLevelTitle = "Diamond Legend";
  else if (unlockedCount === 4) currentLevelTitle = "Platinum Director";
  else if (unlockedCount === 3) currentLevelTitle = "Gold Partner";
  else if (unlockedCount === 2) currentLevelTitle = "Silver Ambassador";
  else if (unlockedCount === 1) currentLevelTitle = "Bronze Affiliate";
  let vipTier = "Bronze Affiliate";
  let nextTierRequirement = `${1 - fundedCount} funded referral(s) left to Bronze Affiliate`;
  if (fundedCount >= 50) {
    vipTier = "Diamond Legend";
    nextTierRequirement = "Maximum Diamond Milestone Unlocked \u{1F3C6}";
  } else if (fundedCount >= 25) {
    vipTier = "Platinum Director";
    nextTierRequirement = `${50 - fundedCount} funded referral(s) left to Diamond Legend`;
  } else if (fundedCount >= 12) {
    vipTier = "Gold Partner";
    nextTierRequirement = `${25 - fundedCount} funded referral(s) left to Platinum Director`;
  } else if (fundedCount >= 5) {
    vipTier = "Silver Ambassador";
    nextTierRequirement = `${12 - fundedCount} funded referral(s) left to Gold Partner`;
  } else if (fundedCount >= 1) {
    vipTier = "Bronze Affiliate";
    nextTierRequirement = `${5 - fundedCount} funded referral(s) left to Silver Ambassador`;
  }
  user.vipTier = vipTier;
  const totalRefRewards = enrichedTeamMembers.reduce((sum, r) => sum + (r.reward || 0), 0);
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
    teamMembers: enrichedTeamMembers
  });
});
apiRouter.post("/referrals/claim-milestone", async (req, res) => {
  const { userId, milestoneId } = req.body;
  if (!userId || !milestoneId) {
    return res.status(400).json({ success: false, message: "Missing userId or milestoneId" });
  }
  const user = db.users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  const milestone = AFFILIATE_MILESTONES.find((m) => m.id === milestoneId);
  if (!milestone) {
    return res.status(400).json({ success: false, message: "Invalid milestone ID" });
  }
  const fundedCount = getFundedReferralsCount(user.id);
  if (fundedCount < milestone.requiredRefs) {
    return res.status(400).json({
      success: false,
      message: `Qualification required: You need at least ${milestone.requiredRefs} funded referral(s) (with completed 1st deposit) to claim ${milestone.title}. Currently funded: ${fundedCount}.`
    });
  }
  user.claimedMilestones = user.claimedMilestones || [];
  if (user.claimedMilestones.includes(milestoneId)) {
    return res.status(400).json({
      success: false,
      message: `You have already claimed the ${milestone.title} (${milestone.rewardText}) reward.`
    });
  }
  const bonusAmount = user.currency === "USD" ? milestone.rewardUsd : milestone.rewardGhs;
  user.claimedMilestones.push(milestoneId);
  user.balance = Number((user.balance + bonusAmount).toFixed(2));
  user.totalRewards = Number(((user.totalRewards || 0) + bonusAmount).toFixed(2));
  user.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  const tx = {
    id: `tx_ms_${Date.now()}`,
    userId: user.id,
    type: "deposit",
    amount: bonusAmount,
    currency: user.currency || "GHS",
    reference: `MILESTONE-${milestone.name}-${Date.now().toString().slice(-4)}`,
    description: `Affiliate Milestone Reward: ${milestone.title} (${milestone.rewardText})`,
    status: "completed",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
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
            updatedAt: user.updatedAt
          }
        }
      );
    } catch (e) {
      console.error("[MongoDB] Error updating claimed milestone:", e);
    }
  }
  res.json({
    success: true,
    message: `\u{1F389} Congratulations! ${user.currency === "USD" ? "$" + milestone.rewardUsd : "GHS " + milestone.rewardGhs.toFixed(2)} (${milestone.rewardText}) has been added to your balance!`,
    balance: user.balance,
    claimedMilestones: user.claimedMilestones,
    user
  });
});
apiRouter.get("/settings", (req, res) => {
  res.json({ success: true, settings: db.settings });
});
apiRouter.get("/admin/stats", (req, res) => {
  const totalUsers = db.users.length;
  const activeContracts = db.miningContracts.filter((c) => c.status === "active").length;
  const totalDeposits = db.deposits.reduce((sum, d) => d.status === "confirmed" ? sum + d.amount : sum, 0);
  const totalWithdrawals = db.withdrawals.reduce((sum, w) => sum + w.amount, 0);
  const totalRewardsIssued = db.users.reduce((sum, u) => sum + u.totalRewards, 0);
  res.json({
    success: true,
    stats: {
      totalUsers,
      activeContracts,
      totalDeposits,
      totalWithdrawals,
      totalRewardsIssued
    },
    plans: db.miningPlans,
    users: db.users,
    deposits: db.deposits,
    withdrawals: db.withdrawals,
    settings: db.settings
  });
});
apiRouter.post("/admin/plans", (req, res) => {
  const { name, description, price, duration, rewardRate } = req.body;
  const pPrice = Number(price);
  const pDur = Number(duration);
  const pRate = Number(rewardRate) / 100;
  const estDaily = Number((pPrice * pRate).toFixed(2));
  const estTotal = Number((estDaily * pDur).toFixed(2));
  const newPlan = {
    id: `plan_${Date.now()}`,
    name,
    description: description || "High-efficiency digital mining plan.",
    price: pPrice,
    duration: pDur,
    rewardRate: pRate,
    estimatedDailyReward: estDaily,
    estimatedTotalReward: estTotal,
    image: "https://images.unsplash.com/photo-1622979135225-d2ba269bc1bd?auto=format&fit=crop&w=400&q=80",
    active: true,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.miningPlans.push(newPlan);
  db.saveData();
  res.json({ success: true, message: "New mining plan created successfully", plan: newPlan });
});
apiRouter.post("/admin/plans/:id", (req, res) => {
  const plan = db.miningPlans.find((p) => p.id === req.params.id);
  if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });
  const { price, duration, rewardRate, active } = req.body;
  if (price !== void 0) plan.price = Number(price);
  if (duration !== void 0) plan.duration = Number(duration);
  if (rewardRate !== void 0) plan.rewardRate = Number(rewardRate) / 100;
  if (active !== void 0) plan.active = Boolean(active);
  plan.estimatedDailyReward = Number((plan.price * plan.rewardRate).toFixed(2));
  plan.estimatedTotalReward = Number((plan.estimatedDailyReward * plan.duration).toFixed(2));
  plan.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  db.saveData();
  res.json({ success: true, message: "Plan updated successfully", plan });
});
apiRouter.post("/admin/deposits/:id/approve", (req, res) => {
  const deposit = db.deposits.find((d) => d.id === req.params.id);
  if (!deposit) return res.status(404).json({ success: false, message: "Deposit not found" });
  if (deposit.status === "confirmed") {
    return res.status(400).json({ success: false, message: "Deposit already confirmed" });
  }
  deposit.status = "confirmed";
  deposit.confirmations = deposit.requiredConfirmations || 3;
  deposit.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  const user = db.users.find((u) => u.id === deposit.userId);
  if (user) {
    user.balance = Number((user.balance + deposit.amount).toFixed(2));
    user.totalDeposits = Number(((user.totalDeposits || 0) + deposit.amount).toFixed(2));
    user.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    db.transactions.unshift({
      id: `tx_dep_${Date.now()}`,
      userId: user.id,
      type: "deposit",
      amount: deposit.amount,
      currency: "GHS",
      reference: deposit.reference,
      description: `Confirmed Deposit via ${deposit.provider}`,
      status: "completed",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    creditReferralBonus(user, deposit);
  }
  db.saveData();
  res.json({ success: true, message: "Deposit approved and user credited successfully", deposit, user });
});
apiRouter.post("/admin/deposits/:id/reject", (req, res) => {
  const deposit = db.deposits.find((d) => d.id === req.params.id);
  if (!deposit) return res.status(404).json({ success: false, message: "Deposit not found" });
  deposit.status = "rejected";
  deposit.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  db.saveData();
  res.json({ success: true, message: "Deposit rejected successfully", deposit });
});
apiRouter.post("/admin/users/:id/credit", (req, res) => {
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  const { amount, planId, note } = req.body;
  const numAmount = Number(amount || 0);
  if (numAmount > 0) {
    user.balance = Number((user.balance + numAmount).toFixed(2));
    user.totalDeposits = Number(((user.totalDeposits || 0) + numAmount).toFixed(2));
    db.transactions.unshift({
      id: `tx_admin_credit_${Date.now()}`,
      userId: user.id,
      type: "deposit",
      amount: numAmount,
      currency: "GHS",
      reference: `ADMIN-CREDIT-${Date.now().toString().slice(-5)}`,
      description: note || "Admin manual balance credit",
      status: "completed",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  if (planId) {
    const plan = db.miningPlans.find((p) => p.id === planId);
    if (plan) {
      const contract = {
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
        startDate: (/* @__PURE__ */ new Date()).toISOString(),
        endDate: new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1e3).toISOString(),
        lastCalculatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        status: "active",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      db.miningContracts.unshift(contract);
      user.activeContracts = (user.activeContracts || 0) + 1;
    }
  }
  user.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  db.saveData();
  res.json({ success: true, message: `User ${user.username} updated/credited successfully`, user });
});
apiRouter.post("/admin/withdrawals/:id/approve", (req, res) => {
  const withdrawal = db.withdrawals.find((w) => w.id === req.params.id);
  if (!withdrawal) return res.status(404).json({ success: false, message: "Withdrawal not found" });
  withdrawal.status = "approved";
  withdrawal.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  const tx = db.transactions.find((t) => t.reference === withdrawal.reference);
  if (tx) tx.status = "completed";
  db.saveData();
  res.json({ success: true, message: "Withdrawal approved successfully", withdrawal });
});
apiRouter.post("/admin/withdrawals/:id/reject", (req, res) => {
  const withdrawal = db.withdrawals.find((w) => w.id === req.params.id);
  if (!withdrawal) return res.status(404).json({ success: false, message: "Withdrawal not found" });
  if (withdrawal.status !== "approved") {
    const user = db.users.find((u) => u.id === withdrawal.userId);
    if (user) {
      user.balance = Number((user.balance + withdrawal.amount).toFixed(2));
      user.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    }
  }
  withdrawal.status = "rejected";
  withdrawal.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  db.saveData();
  res.json({ success: true, message: "Withdrawal rejected and balance refunded", withdrawal });
});
apiRouter.get("/chat", (req, res) => {
  res.json({ success: true, messages: db.chatMessages });
});
apiRouter.post("/chat", (req, res) => {
  const { userId, text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, message: "Message text cannot be empty." });
  }
  let username = "Anonymous_Miner";
  let badge = "Community Member";
  if (userId) {
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      username = user.username;
      badge = (user.totalDeposits || 0) > 0 ? "Verified Miner" : "VIP Member";
    }
  }
  const newMessage = {
    id: `chat_${Date.now()}_${Math.floor(Math.random() * 1e3)}`,
    username,
    text: text.trim(),
    badge,
    type: "chat",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.chatMessages.unshift(newMessage);
  if (db.chatMessages.length > 100) {
    db.chatMessages = db.chatMessages.slice(0, 100);
  }
  db.saveData();
  res.json({ success: true, message: newMessage });
});
var DYNAMIC_FIRST_NAMES = [
  "Kwame",
  "Abena",
  "Kofi",
  "Emmanuel",
  "Rita",
  "Daniel",
  "Grace",
  "Belinda",
  "Bob",
  "Frank",
  "Mercy",
  "Yaw",
  "Samuel",
  "Evelyn",
  "Prince",
  "Patricia",
  "Cynthia",
  "Derrick",
  "Linda",
  "Joseph",
  "Richmond",
  "Vida",
  "Eric",
  "Faustina",
  "Gideon",
  "Harriet",
  "Isaac",
  "Joyce",
  "Kelvin",
  "Lydia",
  "Michael",
  "Naomi",
  "Oliver",
  "Peter",
  "Richard",
  "Sandra",
  "Thomas",
  "Victor",
  "Nana",
  "Kojo",
  "Boateng",
  "Mensah",
  "Osei",
  "Appiah",
  "Owusu",
  "Frimpong",
  "Asante",
  "Kwarteng",
  "Yeboah",
  "Adom"
];
var DYNAMIC_PROVIDERS = [
  "Crypto (USDT - TRC20)",
  "Crypto (USDT - BEP20)",
  "Crypto (USDT)",
  "Crypto (BTC)",
  "Crypto (TRON)",
  "MTN MoMo",
  "Telecel Cash",
  "AT Money"
];
var DYNAMIC_AMOUNTS = [180, 250, 320, 450, 580, 720, 850, 1e3, 1250, 1500, 1800, 2400, 3200, 4500, 6e3];
function generateDynamicSimulatedFeed(count = 15) {
  const shuffledNames = [...DYNAMIC_FIRST_NAMES].sort(() => Math.random() - 0.5);
  const feed = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const isPayout = Math.random() > 0.3;
    const baseName = shuffledNames[i % shuffledNames.length];
    const nameVariation = Math.random();
    let username = baseName;
    if (nameVariation < 0.35) {
      username = `${baseName} ${String.fromCharCode(65 + i % 26)}.`;
    } else if (nameVariation < 0.7) {
      username = `${baseName}_${Math.floor(10 + Math.random() * 90)}`;
    } else if (nameVariation < 0.85) {
      username = `0${["24", "55", "20", "27"][i % 4]}****${100 + i * 37 % 900}`;
    }
    const provider = DYNAMIC_PROVIDERS[Math.floor(Math.random() * DYNAMIC_PROVIDERS.length)];
    const amount = DYNAMIC_AMOUNTS[Math.floor(Math.random() * DYNAMIC_AMOUNTS.length)];
    const minutesAgo = Math.floor(i * 3 + Math.random() * 4 + 1);
    feed.push({
      id: `sim_${now - minutesAgo * 6e4}_${i}`,
      type: isPayout ? "payout" : "deposit",
      isReal: false,
      username,
      amount,
      provider,
      currency: "GHS",
      timestamp: new Date(now - minutesAgo * 6e4).toISOString(),
      badge: isPayout ? "LIVE PAYOUT" : "LIVE RECHARGE"
    });
  }
  return feed;
}
apiRouter.get("/activity-stream", (req, res) => {
  const realDeposits = db.deposits.map((d) => {
    const user = db.users.find((u) => u.id === d.userId);
    const maskedUser = user ? user.username : "User_***";
    return {
      id: `act_${d.id}`,
      type: "deposit",
      isReal: true,
      username: maskedUser,
      amount: d.amount,
      provider: d.provider,
      currency: "GHS",
      status: d.status,
      timestamp: d.createdAt,
      badge: "VERIFIED REAL"
    };
  });
  const realWithdrawals = db.withdrawals.map((w) => {
    const user = db.users.find((u) => u.id === w.userId);
    const maskedUser = user ? user.username : "User_***";
    return {
      id: `act_${w.id}`,
      type: "payout",
      isReal: true,
      username: maskedUser,
      amount: w.amount,
      provider: w.provider,
      currency: "GHS",
      status: w.status,
      timestamp: w.createdAt,
      badge: "VERIFIED REAL"
    };
  });
  const simulatedFeed = generateDynamicSimulatedFeed(15);
  const combined = [...realDeposits, ...realWithdrawals, ...simulatedFeed].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  res.json({ success: true, activities: combined });
});
apiRouter.post("/admin/reset-demo", (req, res) => {
  db.seedInitialData();
  res.json({ success: true, message: "Database reset to initial seed state!" });
});

// server/serverless.ts
init_dbMongo();
var app = express();
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  if (req.query && typeof req.query[0] === "string") {
    const subpath = req.query[0];
    req.url = subpath.startsWith("/") ? `/api${subpath}` : `/api/${subpath}`;
  }
  if (req.url.startsWith("/api/index.js")) {
    const cleaned = req.url.replace(/^\/api\/index\.js/, "");
    req.url = cleaned.startsWith("/") ? `/api${cleaned}` : cleaned ? `/api/${cleaned}` : "/api";
  } else if (req.url.startsWith("/api/index")) {
    const cleaned = req.url.replace(/^\/api\/index/, "");
    req.url = cleaned.startsWith("/") ? `/api${cleaned}` : cleaned ? `/api/${cleaned}` : "/api";
  }
  next();
});
var isInitialized = false;
var lastYieldProcessingTime = 0;
var YIELD_PROCESSING_COOLDOWN = 60 * 1e3;
async function ensureServerlessInit() {
  if (!isInitialized) {
    const connected = await connectMongoDB();
    if (connected) {
      await db.syncFromMongo();
    }
    isInitialized = true;
  }
  const now = Date.now();
  if (now - lastYieldProcessingTime > YIELD_PROCESSING_COOLDOWN) {
    lastYieldProcessingTime = now;
    try {
      processMiningYields();
    } catch (err) {
      console.error("[Vercel Serverless] Mining yield calculation error:", err);
    }
  }
}
app.use(async (req, res, next) => {
  try {
    await ensureServerlessInit();
  } catch (e) {
    console.error("[Vercel Serverless] Init error:", e);
  }
  next();
});
app.get(["/api/cron/process-yields", "/cron/process-yields"], async (req, res) => {
  try {
    await ensureServerlessInit();
    const result = processMiningYields();
    res.json({
      success: true,
      message: "Vercel cron processed mining yields successfully",
      result,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Error processing yields" });
  }
});
app.get(["/api/health", "/health", "/api", "/"], (req, res) => {
  res.json({
    status: "ok",
    app: "CloudMineX Digital Mining Dashboard",
    mode: "Vercel Serverless API Ready",
    mongoConnected: isMongoConnected(),
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.use("/api", apiRouter);
app.use(apiRouter);
var serverless_default = app;
export {
  serverless_default as default
};
