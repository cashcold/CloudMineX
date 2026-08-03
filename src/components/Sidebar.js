import React, { Component } from 'react';
import { Home, TrendingUp, Users, Share2, User, MessageSquare, CreditCard, ArrowUpRight, Cloud, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export class Sidebar extends Component {
  render() {
    const { activeTab, onTabChange, onGoToLanding, user } = this.props;

    const navItems = [
      { id: 'home', label: 'Dashboard', icon: Home },
      { id: 'income', label: 'Mining Yields', icon: TrendingUp },
      { id: 'chat', label: 'Community Chat', icon: MessageSquare },
      { id: 'team', label: 'Team & Network', icon: Users },
      { id: 'share', label: 'Share & Referral', icon: Share2 },
      { id: 'profile', label: 'Account Profile', icon: User },
    ];

    if (activeTab === 'admin' || sessionStorage.getItem('cloudminex_admin_authed') === 'true') {
      navItems.push({ id: 'admin', label: 'Admin Control', icon: ShieldCheck });
    }

    return (
      <aside id="desktop-sidebar" className="hidden md:flex flex-col w-64 bg-[#0D1B2A] border-r border-[#10253A] min-h-screen p-4 sticky top-0 h-screen overflow-y-auto">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 py-3 mb-6 border-b border-[#10253A]">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00D4A8] to-[#2DD4FF] flex items-center justify-center font-bold text-[#07111F] text-lg shadow-md shadow-[#00D4A8]/20">
            CX
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">CloudMineX</h1>
            <p className="text-[10px] text-[#94A3B8] uppercase tracking-widest -mt-0.5">Digital Mining</p>
          </div>
        </div>

        {/* Balance Box */}
        {user && (
          <div className="bg-[#10253A] border border-[#94A3B8]/10 rounded-xl p-4 mb-6 shadow-inner">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Account Balance</p>
              <span className="text-[10px] text-[#00D4A8] font-bold truncate">@{user.username}</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">{formatCurrency(user.balance, user.currency)}</h2>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#94A3B8]/10">
              <button
                onClick={() => onTabChange('recharge')}
                className="flex-1 py-1.5 px-2 rounded-lg bg-gradient-to-r from-[#00D4A8] to-[#2DD4FF] text-[#07111F] text-xs font-bold hover:brightness-110 transition-all flex items-center justify-center gap-1 uppercase"
              >
                <CreditCard className="w-3 h-3" />
                Recharge
              </button>
              <button
                onClick={() => onTabChange('withdraw')}
                className="flex-1 py-1.5 px-2 rounded-lg bg-[#0D1B2A] text-white border border-[#00D4A8]/30 text-xs font-bold hover:bg-[#00D4A8]/10 transition-all flex items-center justify-center gap-1 uppercase"
              >
                <ArrowUpRight className="w-3 h-3" />
                Withdraw
              </button>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <div className="flex-1 space-y-1">
          <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest px-3 mb-2">Navigation</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-medium text-xs transition-all uppercase tracking-wider ${
                  isActive
                    ? 'bg-[#10253A] text-[#00D4A8] font-bold border-l-2 border-[#00D4A8]'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#10253A]/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#00D4A8]' : 'text-[#94A3B8]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {onGoToLanding && (
            <button
              onClick={onGoToLanding}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 mt-3 rounded-lg font-bold text-xs text-[#00D4A8] bg-[#00D4A8]/10 border border-[#00D4A8]/20 hover:bg-[#00D4A8]/20 transition-all uppercase tracking-wider"
            >
              <Cloud className="w-4 h-4 fill-[#00D4A8]" />
              <span>Cloud ☁️ Landing Page</span>
            </button>
          )}
        </div>

        {/* System Info */}
        <div className="mt-auto pt-4 border-t border-[#10253A] text-center">
          <div className="px-3 py-2 rounded-lg bg-[#00D4A8]/10 border border-[#00D4A8]/20 text-[#00D4A8] text-[10px] font-bold uppercase tracking-wider">
            ⚡ Cloud Rigs Active
          </div>
          <p className="text-[10px] text-[#94A3B8] mt-2">CloudMineX v2.4 High Density</p>
        </div>
      </aside>
    );
  }
}

export default Sidebar;

