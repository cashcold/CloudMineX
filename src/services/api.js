import axios from 'axios';

// Directly set Heroku API base URL (uses env variable if present, defaults directly to Heroku)
const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return `${envUrl.replace(/\/$/, '')}/api`;
  }
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

export const userService = {
  login: async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    return res.data;
  },
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },
  getDemoUser: async () => {
    const res = await api.get('/users/demo');
    return res.data;
  },
  getUser: async (id) => {
    const res = await api.get(`/users/${id}`);
    return res.data;
  },
};

export const miningService = {
  getPlans: async () => {
    const res = await api.get('/mining-plans');
    return res.data;
  },
  getPlan: async (id) => {
    const res = await api.get(`/mining-plans/${id}`);
    return res.data;
  },
  startContract: async (userId, planId) => {
    const res = await api.post('/mining/start', { userId, planId });
    return res.data;
  },
  getUserContracts: async (userId) => {
    const res = await api.get(`/mining/user/${userId}`);
    return res.data;
  },
  tickRewards: async (userId) => {
    const res = await api.post('/mining/tick-rewards', { userId });
    return res.data;
  },
};

export const depositService = {
  getCryptoInfo: async () => {
    const res = await api.get('/crypto/currencies');
    return res.data;
  },
  createMobileMoneyDeposit: async (userId, provider, amount) => {
    const res = await api.post('/deposits/mobile-money', { userId, provider, amount });
    return res.data;
  },
  createCryptoDeposit: async (userId, currency, network, amountFiat) => {
    const res = await api.post('/deposits/crypto', { userId, currency, network, amountFiat });
    return res.data;
  },
  getUserDeposits: async (userId) => {
    const res = await api.get(`/deposits/${userId}`);
    return res.data;
  },
  confirmDeposit: async (depositId) => {
    const res = await api.post(`/deposits/${depositId}/confirm-demo`);
    return res.data;
  },
  confirmDemoDeposit: async (depositId) => {
    const res = await api.post(`/deposits/${depositId}/confirm-demo`);
    return res.data;
  },
};

export const withdrawalService = {
  submitWithdrawal: async (userId, amount, destination, provider) => {
    const res = await api.post('/withdrawals/create', { userId, amount, destination, provider });
    return res.data;
  },
  submitDemoWithdrawal: async (userId, amount, destination, provider) => {
    const res = await api.post('/withdrawals/create', { userId, amount, destination, provider });
    return res.data;
  },
  getUserWithdrawals: async (userId) => {
    const res = await api.get(`/withdrawals/${userId}`);
    return res.data;
  },
};

export const incomeService = {
  getIncomeData: async (userId) => {
    const res = await api.get(`/income/${userId}`);
    return res.data;
  },
};

export const referralService = {
  getReferralData: async (userId) => {
    const res = await api.get(`/referrals/${userId}`);
    return res.data;
  },
};

export const adminService = {
  getAdminStats: async () => {
    const res = await api.get('/admin/stats');
    return res.data;
  },
  createPlan: async (planData) => {
    const res = await api.post('/admin/plans', planData);
    return res.data;
  },
  updatePlan: async (id, planData) => {
    const res = await api.post(`/admin/plans/${id}`, planData);
    return res.data;
  },
  approveDeposit: async (depositId) => {
    const res = await api.post(`/admin/deposits/${depositId}/approve`);
    return res.data;
  },
  rejectDeposit: async (depositId) => {
    const res = await api.post(`/admin/deposits/${depositId}/reject`);
    return res.data;
  },
  creditUser: async (userId, data) => {
    const res = await api.post(`/admin/users/${userId}/credit`, data);
    return res.data;
  },
  approveWithdrawal: async (withdrawalId) => {
    const res = await api.post(`/admin/withdrawals/${withdrawalId}/approve`);
    return res.data;
  },
  rejectWithdrawal: async (withdrawalId) => {
    const res = await api.post(`/admin/withdrawals/${withdrawalId}/reject`);
    return res.data;
  },
  resetDemo: async () => {
    const res = await api.post('/admin/reset-demo');
    return res.data;
  },
};

export const chatService = {
  getMessages: async () => {
    const res = await api.get('/chat');
    return res.data;
  },
  sendMessage: async (userId, text) => {
    const res = await api.post('/chat', { userId, text });
    return res.data;
  },
};

export const activityService = {
  getActivityStream: async () => {
    const res = await api.get('/activity-stream');
    return res.data;
  },
};

export default api;