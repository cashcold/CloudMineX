import React, { Component } from 'react';
import { ShieldCheck, Users, Cpu, ArrowDownLeft, ArrowUpRight, Plus, RefreshCw, Settings, Save, Check, ArrowLeft, Lock, KeyRound, LogOut, Eye, EyeOff } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { adminService } from '../services/api';

export class AdminDashboard extends Component {
  constructor(props) {
    super(props);
    const isAuthed = sessionStorage.getItem('cloudminex_admin_authed') === 'true';
    this.state = {
      isAuthenticated: isAuthed,
      adminPasswordInput: '',
      showPassword: false,
      loginError: '',
      statsData: null,
      activeSubTab: 'PLANS', // PLANS, USERS, SETTINGS
      isLoading: isAuthed,
      newPlanName: '',
      newPlanPrice: '',
      newPlanDuration: '7',
      newPlanRate: '5',
      newPlanDesc: '',
      isSubmitting: false,
      message: '',
      errorMessage: '',
    };
    this.handleAdminLogin = this.handleAdminLogin.bind(this);
    this.handleAdminLogout = this.handleAdminLogout.bind(this);
  }

  componentDidMount() {
    if (this.state.isAuthenticated) {
      this.loadAdminStats();
    }
  }

  handleAdminLogin(e) {
    e.preventDefault();
    const { adminPasswordInput } = this.state;
    if (adminPasswordInput === 'admin12345@') {
      sessionStorage.setItem('cloudminex_admin_authed', 'true');
      this.setState({ isAuthenticated: true, loginError: '', adminPasswordInput: '' }, () => {
        this.loadAdminStats();
      });
    } else {
      this.setState({ loginError: 'Invalid Admin Password. Access Denied.' });
    }
  }

  handleAdminLogout() {
    sessionStorage.removeItem('cloudminex_admin_authed');
    this.setState({ isAuthenticated: false, adminPasswordInput: '', loginError: '' });
  }

  async loadAdminStats() {
    this.setState({ isLoading: true });
    try {
      const res = await adminService.getAdminStats();
      if (res.success) {
        this.setState({ statsData: res, isLoading: false });
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      this.setState({ isLoading: false, errorMessage: 'Failed to load admin stats.' });
    }
  }

  async handleCreatePlan(e) {
    e.preventDefault();
    const { newPlanName, newPlanPrice, newPlanDuration, newPlanRate, newPlanDesc } = this.state;

    if (!newPlanName || !newPlanPrice || !newPlanDuration || !newPlanRate) {
      this.setState({ errorMessage: 'Please fill in all plan parameters.' });
      return;
    }

    this.setState({ isSubmitting: true, errorMessage: '', message: '' });

    try {
      const res = await adminService.createPlan({
        name: newPlanName,
        price: Number(newPlanPrice),
        duration: Number(newPlanDuration),
        rewardRate: Number(newPlanRate),
        description: newPlanDesc,
      });

      if (res.success) {
        this.setState({
          message: res.message,
          newPlanName: '',
          newPlanPrice: '',
          newPlanDesc: '',
          isSubmitting: false,
        });
        this.loadAdminStats();
      }
    } catch (err) {
      this.setState({ errorMessage: 'Error creating mining plan.', isSubmitting: false });
    }
  }

  async handleTogglePlanStatus(plan) {
    try {
      await adminService.updatePlan(plan.id, { active: !plan.active });
      this.loadAdminStats();
    } catch (err) {
      console.error('Error toggling plan status:', err);
    }
  }

  render() {
    const { onNavigate } = this.props;
    const {
      isAuthenticated,
      adminPasswordInput,
      showPassword,
      loginError,
      statsData,
      activeSubTab,
      isLoading,
      newPlanName,
      newPlanPrice,
      newPlanDuration,
      newPlanRate,
      newPlanDesc,
      isSubmitting,
      message,
      errorMessage,
    } = this.state;

    // Render Admin Login Lock Screen if not authenticated
    if (!isAuthenticated) {
      return (
        <div id="admin-login-lock" className="max-w-md mx-auto py-10 px-4 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-gradient-to-br from-[#00D4A8]/20 to-[#2DD4FF]/20 border border-[#00D4A8]/40 rounded-2xl flex items-center justify-center mx-auto text-[#00D4A8] shadow-lg shadow-[#00D4A8]/10">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">Admin Portal Login</h2>
            <p className="text-xs text-[#94A3B8] max-w-xs mx-auto">
              This area is restricted to authorized platform administrators. Please enter your administrator password to proceed.
            </p>
          </div>

          <form onSubmit={this.handleAdminLogin} className="bg-[#0D1B2A] p-6 rounded-2xl border border-[#10253A] space-y-4 shadow-xl">
            {loginError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold flex items-center gap-2">
                <Lock className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider block">
                Admin Security Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={adminPasswordInput}
                  onChange={(e) => this.setState({ adminPasswordInput: e.target.value })}
                  placeholder="Enter admin password..."
                  required
                  autoFocus
                  className="w-full pl-9 pr-10 py-3 bg-[#10253A] border border-[#94A3B8]/20 rounded-xl text-sm text-white placeholder-[#94A3B8]/50 focus:outline-none focus:border-[#00D4A8] transition-all"
                />
                <button
                  type="button"
                  onClick={() => this.setState({ showPassword: !showPassword })}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#94A3B8] hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-[#00D4A8] to-[#2DD4FF] text-[#07111F] font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>LOG IN TO ADMIN PANEL</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="w-full py-2.5 text-xs text-[#94A3B8] hover:text-white transition-colors text-center block"
            >
              ← Return to User Dashboard
            </button>
          </form>
        </div>
      );
    }

    const stats = statsData ? statsData.stats : null;

    return (
      <div id="admin-dashboard-page" className="space-y-5 pb-10">
        {/* Admin Header */}
        <div className="flex items-center justify-between border-b border-[#10253A] pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('home')}
              className="p-2 rounded-lg bg-[#10253A] text-[#94A3B8] hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#00D4A8]" />
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">Admin Control Panel</h2>
              </div>
              <p className="text-[10px] text-[#94A3B8]">Configure plans, view metrics & platform settings</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => this.loadAdminStats()}
              className="p-2 rounded-lg bg-[#10253A] text-[#94A3B8] hover:text-white transition-all"
              title="Refresh Admin Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={this.handleAdminLogout}
              className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-all flex items-center gap-1 text-xs font-bold"
              title="Lock & Logout Admin"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Alerts */}
        {message && (
          <div className="p-3 bg-[#00D4A8]/10 border border-[#00D4A8]/30 rounded-xl text-[#00D4A8] text-xs font-semibold">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        {/* Summary Stats Overview Grid */}
        {isLoading || !stats ? (
          <div className="h-28 bg-[#10253A] rounded-2xl animate-pulse"></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-[#10253A] p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Total Users</span>
              <p className="text-lg font-extrabold text-white mt-0.5">{stats.totalUsers}</p>
            </div>

            <div className="bg-[#10253A] p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Active Rigs</span>
              <p className="text-lg font-extrabold text-[#2DD4FF] mt-0.5">{stats.activeContracts}</p>
            </div>

            <div className="bg-[#10253A] p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Confirmed Deposits</span>
              <p className="text-xs font-extrabold text-[#00D4A8] mt-1.5 truncate">
                {formatCurrency(stats.totalDeposits, 'GHS')}
              </p>
            </div>

            <div className="bg-[#10253A] p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Mining Rewards</span>
              <p className="text-xs font-extrabold text-amber-400 mt-1.5 truncate">
                {formatCurrency(stats.totalRewardsIssued, 'GHS')}
              </p>
            </div>
          </div>
        )}

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
          {[
            { id: 'DEPOSITS', label: 'Deposits' },
            { id: 'USERS', label: 'Users & Credit' },
            { id: 'WITHDRAWALS', label: 'Withdrawals' },
            { id: 'PLANS', label: 'Mining Plans' },
            { id: 'SETTINGS', label: 'Settings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => this.setState({ activeSubTab: tab.id, message: '', errorMessage: '' })}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeSubTab === tab.id
                  ? 'bg-[#00D4A8] text-[#07111F]'
                  : 'bg-[#10253A] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* SUB TAB: DEPOSITS MANAGEMENT */}
        {activeSubTab === 'DEPOSITS' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">User Payment Deposits</h3>
              <span className="text-[10px] text-slate-400">Click Approve to credit user balance</span>
            </div>

            {statsData && statsData.deposits && statsData.deposits.length > 0 ? (
              <div className="space-y-2">
                {statsData.deposits.map((dep) => {
                  const depUser = statsData.users?.find((u) => u.id === dep.userId);
                  const isPending = dep.status === 'pending' || dep.status === 'confirming' || dep.status === 'detected';

                  return (
                    <div key={dep.id} className="bg-[#10253A] p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{depUser ? depUser.username : 'User ' + dep.userId}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            dep.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {dep.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-semibold">
                          Amount: <span className="text-[#00D4A8] font-bold">{formatCurrency(dep.amount, 'GHS')}</span> via <span className="text-[#2DD4FF]">{dep.provider}</span>
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Ref: {dep.reference} {dep.transactionHash ? `• TxHash: ${dep.transactionHash.slice(0, 10)}...` : ''}
                        </p>
                      </div>

                      {isPending ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={async () => {
                              try {
                                this.setState({ isSubmitting: true });
                                const res = await adminService.approveDeposit(dep.id);
                                if (res.success) {
                                  this.setState({ message: `Approved! Credited GHS ${dep.amount} to user account.`, isSubmitting: false });

                                  if (window.triggerJackpotCelebration) {
                                    window.triggerJackpotCelebration({
                                      type: 'deposit',
                                      amount: dep.amount,
                                      title: 'ADMIN DEPOSIT APPROVED!',
                                      message: `GHS ${dep.amount.toFixed(2)} deposit approved and credited to user balance!`,
                                    });
                                  }

                                  this.loadAdminStats();
                                }
                              } catch (err) {
                                this.setState({ errorMessage: 'Failed to approve deposit.', isSubmitting: false });
                              }
                            }}
                            disabled={isSubmitting}
                            className="px-3 py-1.5 bg-[#00D4A8] text-[#07111F] font-extrabold text-xs rounded-xl hover:brightness-110 transition-all"
                          >
                            Approve
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                this.setState({ isSubmitting: true });
                                const res = await adminService.rejectDeposit(dep.id);
                                if (res.success) {
                                  this.setState({ message: `Deposit rejected for reference ${dep.reference}.`, isSubmitting: false });
                                  this.loadAdminStats();
                                }
                              } catch (err) {
                                this.setState({ errorMessage: 'Failed to reject deposit.', isSubmitting: false });
                              }
                            }}
                            disabled={isSubmitting}
                            className="px-3 py-1.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs rounded-xl hover:bg-rose-500/30 transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      ) : dep.status === 'confirmed' ? (
                        <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                          <Check className="w-4 h-4" /> Confirmed & Credited
                        </span>
                      ) : (
                        <span className="text-xs text-rose-400 font-bold">
                          Rejected
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 bg-[#10253A] rounded-2xl text-center border border-slate-800">
                <p className="text-xs text-slate-400">No deposit records found.</p>
              </div>
            )}
          </div>
        )}

        {/* SUB TAB: USERS & MANUAL CREDIT MANAGEMENT */}
        {activeSubTab === 'USERS' && (
          <div className="space-y-4">
            <div className="bg-[#10253A] p-4 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Manual Credit / Activate User Account</h3>
              <p className="text-[10px] text-slate-400">Select a user to credit their balance or activate a Cloud Mining Plan directly</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Select User</label>
                  <select
                    id="credit-user-select"
                    className="w-full bg-[#0D1B2A] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00D4A8]"
                    onChange={(e) => this.setState({ selectedUserId: e.target.value })}
                    value={this.state.selectedUserId || ''}
                  >
                    <option value="">-- Choose User --</option>
                    {statsData && statsData.users && statsData.users.map((u) => (
                      <option key={u.id} value={u.id}>{u.username} (Bal: GHS {u.balance})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Credit Amount (GHS)</label>
                  <input
                    type="number"
                    placeholder="e.g. 100"
                    value={this.state.creditAmount || ''}
                    onChange={(e) => this.setState({ creditAmount: e.target.value })}
                    className="w-full bg-[#0D1B2A] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00D4A8]"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Auto-Activate Mining Plan (Optional)</label>
                  <select
                    className="w-full bg-[#0D1B2A] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00D4A8]"
                    onChange={(e) => this.setState({ selectedPlanId: e.target.value })}
                    value={this.state.selectedPlanId || ''}
                  >
                    <option value="">-- Do Not Activate Plan --</option>
                    {statsData && statsData.plans && statsData.plans.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} (GHS {p.price})</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  const { selectedUserId, creditAmount, selectedPlanId } = this.state;
                  if (!selectedUserId) {
                    this.setState({ errorMessage: 'Please select a user to credit.' });
                    return;
                  }
                  try {
                    this.setState({ isSubmitting: true, errorMessage: '' });
                    const res = await adminService.creditUser(selectedUserId, {
                      amount: Number(creditAmount || 0),
                      planId: selectedPlanId,
                      note: 'Admin manual deposit credit',
                    });
                    if (res.success) {
                      this.setState({ message: res.message, creditAmount: '', isSubmitting: false });

                      if (Number(creditAmount) > 0 && window.triggerJackpotCelebration) {
                        window.triggerJackpotCelebration({
                          type: 'deposit',
                          amount: Number(creditAmount),
                          title: 'BALANCE CREDITED!',
                          message: `GHS ${Number(creditAmount).toFixed(2)} credited to balance!`,
                        });
                      }

                      this.loadAdminStats();
                    }
                  } catch (err) {
                    this.setState({ errorMessage: 'Failed to credit user.', isSubmitting: false });
                  }
                }}
                disabled={isSubmitting}
                className="w-full py-2.5 bg-[#00D4A8] text-[#07111F] font-bold text-xs uppercase rounded-xl hover:brightness-110 transition-all"
              >
                {isSubmitting ? 'Updating Account...' : 'CREDIT USER ACCOUNT'}
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Registered Platform Users</h3>
              {statsData && statsData.users ? (
                statsData.users.map((u) => (
                  <div key={u.id} className="bg-[#10253A] p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-xs">{u.username}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">ID: {u.id} • Ref Code: {u.referralCode}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-[#00D4A8]">{formatCurrency(u.balance, u.currency)}</p>
                      <span className="text-[9px] text-slate-400 font-medium">Active Rigs: {u.activeContracts || 0}</span>
                    </div>
                  </div>
                ))
              ) : null}
            </div>
          </div>
        )}

        {/* SUB TAB: WITHDRAWALS MANAGEMENT */}
        {activeSubTab === 'WITHDRAWALS' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">User Withdrawal Requests</h3>
            {statsData && statsData.withdrawals && statsData.withdrawals.length > 0 ? (
              <div className="space-y-2">
                {statsData.withdrawals.map((wd) => {
                  const wdUser = statsData.users?.find((u) => u.id === wd.userId);
                  return (
                    <div key={wd.id} className="bg-[#10253A] p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{wdUser ? wdUser.username : 'User ' + wd.userId}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            wd.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            wd.status === 'rejected' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                            'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {wd.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#00D4A8] font-bold mt-1">
                          Amount: {formatCurrency(wd.amount, 'GHS')}
                        </p>
                        <p className="text-[10px] text-slate-300">
                          Destination: <span className="font-mono text-white">{wd.destination}</span> ({wd.provider})
                        </p>
                      </div>

                      {wd.status === 'pending' || wd.status === 'demo-pending' ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={async () => {
                              try {
                                const res = await adminService.approveWithdrawal(wd.id);
                                if (res.success) {
                                  this.setState({ message: 'Withdrawal approved successfully.' });
                                  this.loadAdminStats();
                                }
                              } catch (err) {
                                this.setState({ errorMessage: 'Failed to approve withdrawal.' });
                              }
                            }}
                            className="px-3 py-1.5 bg-emerald-500 text-white font-bold text-xs rounded-lg hover:bg-emerald-600 transition-all"
                          >
                            Approve
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const res = await adminService.rejectWithdrawal(wd.id);
                                if (res.success) {
                                  this.setState({ message: 'Withdrawal rejected and balance refunded.' });
                                  this.loadAdminStats();
                                }
                              } catch (err) {
                                this.setState({ errorMessage: 'Failed to reject withdrawal.' });
                              }
                            }}
                            className="px-3 py-1.5 bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold text-xs rounded-lg hover:bg-rose-500/30 transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 bg-[#10253A] rounded-2xl text-center border border-slate-800">
                <p className="text-xs text-slate-400">No withdrawal requests found.</p>
              </div>
            )}
          </div>
        )}

        {/* SUB TAB 3: APP SETTINGS */}
        {activeSubTab === 'SETTINGS' && statsData && statsData.settings && (
          <div className="bg-[#10253A] p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Configured Payment Addresses</h3>

            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">BTC Address</p>
              <p className="font-mono text-[#00D4A8]">{statsData.settings.btcAddress}</p>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">ETH Address</p>
              <p className="font-mono text-[#00D4A8]">{statsData.settings.ethAddress}</p>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">USDT TRC-20 Address</p>
              <p className="font-mono text-[#00D4A8]">{statsData.settings.usdtTrc20Address}</p>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">MTN MoMo Merchant</p>
              <p className="font-bold text-white">{statsData.settings.mtnMerchantName} ({statsData.settings.mtnMerchantNumber})</p>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default AdminDashboard;
