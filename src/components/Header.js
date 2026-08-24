import React, { Component } from 'react';
import { Bell, ShieldCheck, Cloud } from 'lucide-react';
import LiveMiningBadge from './LiveMiningBadge';

export class Header extends Component {
  render() {
    const { activeTab, onTabChange, onGoToLanding, user } = this.props;
    const userInitials = user && user.username ? user.username.substring(0, 2).toUpperCase() : 'CX';

    return (
      <header id="main-header" className="sticky top-0 z-40 w-full bg-[#0D1B2A] border-b border-[#10253A] px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 overflow-x-hidden">
        {/* Brand Logo */}
        <div 
          id="header-brand"
          className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0"
          onClick={() => onTabChange('home')}
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#00D4A8] to-[#2DD4FF] rounded-lg flex items-center justify-center font-bold text-[#07111F] text-sm sm:text-lg shadow-md shadow-[#00D4A8]/20 shrink-0">
            CX
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight truncate">CloudMineX</h1>
            <p className="hidden sm:block text-[9px] sm:text-[10px] text-[#94A3B8] uppercase tracking-widest -mt-0.5 truncate">Digital Mining Dashboard</p>
          </div>
        </div>

        {/* Right Header Actions */}
        <div id="header-actions" className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <div className="hidden lg:flex">
            <LiveMiningBadge />
          </div>

          {/* Landing Page Shortcut */}
          {onGoToLanding && (
            <button
              onClick={onGoToLanding}
              className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-[10px] font-bold text-[#00D4A8] bg-[#00D4A8]/10 border border-[#00D4A8]/30 hover:bg-[#00D4A8]/20 transition-all uppercase tracking-wider flex items-center gap-1 shrink-0"
              title="Return to Cloud Mining Landing Page"
            >
              <Cloud className="w-3.5 h-3.5 fill-[#00D4A8]" />
              <span className="hidden md:inline">Landing</span>
            </button>
          )}

          <button 
            id="notification-btn"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#10253A] border border-[#94A3B8]/20 flex items-center justify-center text-[#94A3B8] hover:text-white transition-colors relative shrink-0"
            title="Notifications"
            onClick={() => alert("Notification: CloudMineX Live Cloud Rig is active and operational.")}
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#00D4A8] rounded-full"></span>
          </button>

          {/* User Badge */}
          <div 
            onClick={() => onTabChange('profile')}
            className="flex items-center gap-1.5 sm:gap-2 bg-[#10253A] border border-[#00D4A8]/30 rounded-full p-1 sm:pl-2 sm:pr-3 cursor-pointer hover:border-[#00D4A8] transition-all shrink-0"
            title="Account Profile"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#00D4A8] to-[#2DD4FF] flex items-center justify-center text-[#07111F] font-black text-[10px] shrink-0">
              {userInitials}
            </div>
            <span className="hidden sm:inline text-xs font-bold text-white max-w-[90px] sm:max-w-[120px] truncate">
              {user && user.username ? user.username : 'Account'}
            </span>
          </div>
        </div>
      </header>
    );
  }
}

export default Header;

