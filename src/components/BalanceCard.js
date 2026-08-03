import React, { Component } from 'react';
import { RefreshCw, Plus, ArrowUpRight, Award } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { referralService } from '../services/api';

export class BalanceCard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      vipTier: 'Bronze VIP',
      nextRequirement: '10 funded referrals left to Silver VIP',
    };
  }

  componentDidMount() {
    this.fetchReferralData();
  }

  componentDidUpdate(prevProps) {
    if (this.props.user && (!prevProps.user || prevProps.user.id !== this.props.user.id)) {
      this.fetchReferralData();
    }
  }

  async fetchReferralData() {
    const { user } = this.props;
    if (!user) return;
    try {
      const res = await referralService.getReferralData(user.id);
      if (res && res.vipTier) {
        this.setState({
          vipTier: res.vipTier,
          nextRequirement: res.nextTierRequirement || '',
        });
      }
    } catch (e) {
      console.error('Error fetching referral VIP tier:', e);
    }
  }

  render() {
    const { user, onNavigate, onTickRewards, isTicking } = this.props;
    const { vipTier, nextRequirement } = this.state;

    if (!user) {
      return (
        <div className="w-full bg-[#10253A] rounded-2xl p-6 border border-[#94A3B8]/10 animate-pulse h-52"></div>
      );
    }

    // Calculated crypto values
    const btcVal = (user.balance * 0.0000042).toFixed(4);
    const ethVal = (user.balance * 0.000081).toFixed(3);
    const usdtVal = (user.balance / 12.0).toFixed(2); // ~12 GHS per USDT

    return (
      <div id="balance-card" className="w-full bg-[#10253A] rounded-2xl p-6 border border-[#94A3B8]/10 shadow-2xl bg-opacity-80 backdrop-blur-md relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D4A8]/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>

        {/* Card Header Top */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-[#94A3B8] text-xs font-medium uppercase tracking-widest mb-1">Available Balance</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              {formatCurrency(user.balance, user.currency)}
            </h2>
            <div className="mt-2 flex flex-wrap gap-3 sm:gap-4 text-xs font-mono">
              <span className="text-[#00D4A8] font-bold">≈ {btcVal} BTC</span>
              <span className="text-[#2DD4FF] font-bold">≈ {ethVal} ETH</span>
              <span className="text-[#F59E0B] font-bold">≈ {usdtVal} USDT</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => onNavigate('recharge')}
              className="bg-gradient-to-r from-[#00D4A8] to-[#2DD4FF] text-[#07111F] px-4 py-2.5 rounded-lg font-bold text-xs uppercase transition-all shadow-lg shadow-[#00D4A8]/20 hover:brightness-110 active:scale-95 flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>Recharge</span>
            </button>
            <button
              onClick={() => onNavigate('withdraw')}
              className="bg-[#10253A] border border-[#00D4A8]/30 text-white px-4 py-2.5 rounded-lg font-bold text-xs uppercase hover:bg-[#00D4A8]/10 active:scale-95 transition-all flex items-center justify-center gap-1"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Withdraw</span>
            </button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-3 gap-4 border-t border-[#94A3B8]/10 pt-5">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-0.5">
              <p className="text-[#94A3B8] text-[10px] uppercase tracking-wider">Est. Yield</p>
              <button
                onClick={onTickRewards}
                disabled={isTicking}
                className="text-[9px] text-[#00D4A8] hover:underline flex items-center gap-1"
                title="Calculate Daily Yield"
              >
                <RefreshCw className={`w-2.5 h-2.5 ${isTicking ? 'animate-spin' : ''}`} />
                <span>Yield</span>
              </button>
            </div>
            <p className="text-base sm:text-lg font-semibold text-[#00D4A8] truncate">
              {formatCurrency(user.totalRewards || 0, user.currency)}
            </p>
          </div>

          <div className="flex flex-col">
            <p className="text-[#94A3B8] text-[10px] uppercase tracking-wider mb-0.5">Active Miners</p>
            <p className="text-base sm:text-lg font-semibold text-white">
              {user.activeContracts || 0} Units
            </p>
          </div>

          <div className="flex flex-col">
            <p className="text-[#94A3B8] text-[10px] uppercase tracking-wider mb-0.5">Referral Tier</p>
            <div className="flex items-center gap-1">
              <Award className="w-4 h-4 text-[#2DD4FF]" />
              <p className="text-base sm:text-lg font-semibold text-[#2DD4FF] truncate">
                {user.vipTier || vipTier}
              </p>
            </div>
            {nextRequirement && (
              <p className="text-[9px] text-slate-400 mt-0.5 truncate">{nextRequirement}</p>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default BalanceCard;

