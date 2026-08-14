import React, { Component } from 'react';
import { User, HelpCircle, Info, RefreshCw, LogOut, ArrowLeft, Cpu, Wallet, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { userService, adminService } from '../services/api';

export class Profile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: null,
      isResetting: false,
      message: '',
    };
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

  async handleResetDemoData() {
    if (!window.confirm('Reset demo database state to default seed data?')) return;

    this.setState({ isResetting: true });
    try {
      const res = await adminService.resetDemo();
      if (res.success) {
        this.setState({ message: res.message, isResetting: false });
        this.loadUserData();
        setTimeout(() => this.setState({ message: '' }), 4000);
      }
    } catch (err) {
      this.setState({ isResetting: false });
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
              <Info className="w-5 h-5 text-amber-400" />
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
              <LogOut className="w-5 h-5 text-[#00D4A8]" />
              <div>
                <p className="text-xs font-bold text-[#00D4A8]">Log Out Account</p>
                <p className="text-[10px] text-slate-400">Sign out and return to Login/Register screen</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }
}

export default Profile;
