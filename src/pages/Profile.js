import React, { Component } from 'react';
import { User, HelpCircle, Info, RefreshCw, LogOut, ArrowLeft, Cpu, Wallet, TrendingUp, AlertTriangle, KeyRound, Check, Eye, EyeOff } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { userService, adminService } from '../services/api';

export class Profile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: null,
      isResetting: false,
      message: '',
      errorMsg: '',
      showChangePasswordModal: false,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      showNewPassword: false,
      isUpdatingPassword: false,
    };

    this.handleUpdatePassword = this.handleUpdatePassword.bind(this);
  }

  componentDidMount() {
    this.loadUserData();
  }

  componentDidUpdate(prevProps) {
    if (this.props.user && (!prevProps.user || prevProps.user.id !== this.props.user.id)) {
      this.loadUserData();
    }
  }

  async loadUserData() {
    try {
      let currentUser = this.props.user;
      if (!currentUser) {
        const res = await userService.getDemoUser();
        currentUser = res.user;
      } else {
        const res = await userService.getUser(currentUser.id);
        if (res && res.user) {
          currentUser = res.user;
        }
      }
      if (currentUser) {
        this.setState({ user: currentUser });
      }
    } catch (err) {
      console.error('Error fetching profile user:', err);
    }
  }

  async handleUpdatePassword(e) {
    e.preventDefault();
    const { user, currentPassword, newPassword, confirmPassword } = this.state;
    if (!newPassword || newPassword.length < 4) {
      this.setState({ errorMsg: 'New password must be at least 4 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      this.setState({ errorMsg: 'New passwords do not match.' });
      return;
    }

    this.setState({ isUpdatingPassword: true, errorMsg: '', message: '' });

    try {
      const res = await userService.updatePassword({
        userId: user.id,
        currentPassword,
        newPassword,
      });

      if (res.success) {
        this.setState({
          message: 'Password successfully updated!',
          showChangePasswordModal: false,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          isUpdatingPassword: false,
        });
        setTimeout(() => this.setState({ message: '' }), 4000);
      } else {
        this.setState({ errorMsg: res.message || 'Failed to update password.', isUpdatingPassword: false });
      }
    } catch (err) {
      const errMsg = err?.response?.data?.message || 'Error updating password.';
      this.setState({ errorMsg: errMsg, isUpdatingPassword: false });
    }
  }

  render() {
    const { onNavigate } = this.props;
    const { user, isResetting, message } = this.state;

    return (
      <div id="profile-page" className="space-y-5 pb-10">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#10253A] pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('home')}
              className="p-2 rounded-lg bg-[#10253A] text-[#94A3B8] hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Account Profile & Settings</h2>
          </div>
        </div>

        {message && (
          <div className="p-3 bg-[#00D4A8]/10 border border-[#00D4A8]/30 rounded-xl text-[#00D4A8] text-xs font-semibold">
            {message}
          </div>
        )}

        {/* Profile User Identity Card */}
        {user ? (
          <div className="bg-[#10253A] p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#00D4A8] to-[#2DD4FF] p-0.5 shadow-lg shadow-[#00D4A8]/20 flex items-center justify-center">
                <div className="w-full h-full bg-[#07111F] rounded-[14px] flex items-center justify-center">
                  <User className="w-7 h-7 text-[#00D4A8]" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">{user.username}</h3>
                <p className="text-xs text-[#94A3B8] font-mono">{user.phone || `ID: ${user.id}`}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#00D4A8]/10 text-[#00D4A8] text-[10px] font-bold border border-[#00D4A8]/30">
                    VERIFIED ACCOUNT
                  </span>
                  {user.paymentMethod && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700">
                      Payment: {user.paymentMethod.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Account Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-center">
              <div className="bg-[#0D1B2A] p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Balance</span>
                <span className="text-xs font-bold text-[#00D4A8] mt-0.5 truncate block">
                  {formatCurrency(user.balance, user.currency)}
                </span>
              </div>

              <div className="bg-[#0D1B2A] p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Active Miners</span>
                <span className="text-xs font-bold text-[#2DD4FF] mt-0.5 block">{user.activeContracts || 0} Units</span>
              </div>

              <div className="bg-[#0D1B2A] p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total Rewards</span>
                <span className="text-xs font-bold text-amber-400 mt-0.5 truncate block">
                  {formatCurrency(user.totalRewards || 0, user.currency)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-40 bg-[#10253A] rounded-2xl animate-pulse"></div>
        )}

        {/* Menu Options List */}
        <div className="bg-[#10253A] rounded-2xl border border-slate-800 overflow-hidden divide-y divide-slate-800/80">
          <button
            onClick={() => this.setState({ showChangePasswordModal: true, errorMsg: '', message: '' })}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-[#0D1B2A] transition-colors"
          >
            <div className="flex items-center gap-3">
              <KeyRound className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-xs font-bold text-white">Security & Password</p>
                <p className="text-[10px] text-slate-400">Update account password</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => alert("CloudMineX Support: Contact support@cloudminex.io for 24/7 live assistant.")}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-[#0D1B2A] transition-colors"
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-[#2DD4FF]" />
              <div>
                <p className="text-xs font-bold text-white">Help & Support</p>
                <p className="text-[10px] text-slate-400">FAQs and system assistance</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => alert("CloudMineX v2.4 Digital Mining Dashboard. Designed for mobile-first cloud mining monitoring.")}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-[#0D1B2A] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-[#00D4A8]" />
              <div>
                <p className="text-xs font-bold text-white">About CloudMineX</p>
                <p className="text-[10px] text-slate-400">Platform architecture and version information</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              localStorage.removeItem('cloudminex_user_id');
              if (this.props.onGoToLanding) {
                this.props.onGoToLanding();
              } else {
                onNavigate('landing');
              }
            }}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-[#00D4A8]/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-rose-400" />
              <div>
                <p className="text-xs font-bold text-rose-400">Log Out Account</p>
                <p className="text-[10px] text-slate-400">Sign out and return to Login/Register screen</p>
              </div>
            </div>
          </button>
        </div>

        {/* Change Password Modal */}
        {this.state.showChangePasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-[#0D1B2A] border border-[#10253A] rounded-2xl max-w-sm w-full p-5 shadow-2xl relative">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Update Password</span>
              </h3>

              {this.state.errorMsg && (
                <div className="mb-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                  {this.state.errorMsg}
                </div>
              )}

              <form onSubmit={this.handleUpdatePassword} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Current Password (optional if not set)
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={this.state.currentPassword}
                    onChange={(e) => this.setState({ currentPassword: e.target.value })}
                    className="w-full bg-[#10253A] border border-slate-700 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D4A8]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={this.state.showNewPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={this.state.newPassword}
                      onChange={(e) => this.setState({ newPassword: e.target.value })}
                      className="w-full bg-[#10253A] border border-slate-700 rounded-xl py-2 pl-3 pr-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D4A8]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => this.setState({ showNewPassword: !this.state.showNewPassword })}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                    >
                      {this.state.showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={this.state.confirmPassword}
                    onChange={(e) => this.setState({ confirmPassword: e.target.value })}
                    className="w-full bg-[#10253A] border border-slate-700 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D4A8]"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => this.setState({ showChangePasswordModal: false, errorMsg: '' })}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={this.state.isUpdatingPassword}
                    className="flex-1 py-2.5 rounded-xl bg-[#00D4A8] text-[#07111F] text-xs font-extrabold hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{this.state.isUpdatingPassword ? 'Saving...' : 'Save Password'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default Profile;
