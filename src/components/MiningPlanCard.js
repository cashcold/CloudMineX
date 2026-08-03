import React, { Component } from 'react';
import { formatCurrency } from '../utils/formatters';

export class MiningPlanCard extends Component {
  render() {
    const { plan, onStartMining, isLoading, userBalance, isPopular } = this.props;

    if (!plan) return null;

    const canAfford = userBalance >= plan.price;
    const isFeatured = isPopular || plan.price === 300 || plan.rewardRate >= 0.08;

    return (
      <div 
        id={`plan-card-${plan.id}`} 
        className={`p-4 rounded-xl flex flex-col justify-between transition-all duration-300 ${
          isFeatured
            ? 'bg-[#10253A]/80 border border-[#00D4A8]/40 ring-1 ring-[#00D4A8]/30 shadow-xl'
            : 'bg-[#10253A]/50 border border-[#94A3B8]/10 hover:border-[#00D4A8]/40 shadow-md'
        }`}
      >
        {/* Card Graphic Header */}
        <div className="w-full h-24 bg-[#0D1B2A] rounded-lg mb-3.5 flex items-center justify-center border border-[#94A3B8]/5 overflow-hidden relative group">
          {plan.image ? (
            <img
              src={plan.image}
              alt={plan.name}
              className="w-full h-full object-cover opacity-30 group-hover:scale-105 transition-transform duration-500"
            />
          ) : null}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-[#00D4A8] opacity-20 font-black text-2xl tracking-widest uppercase">
              {plan.name.split(' ')[0]}
            </div>
          </div>

          {isFeatured && (
            <span className="absolute top-2 right-2 bg-[#00D4A8] text-[#07111F] text-[8px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider shadow">
              POPULAR
            </span>
          )}
        </div>

        {/* Title and Price */}
        <div>
          <div className="flex justify-between items-start mb-1">
            <h4 className="font-bold text-sm text-white">{plan.name}</h4>
          </div>
          <p className="text-[#00D4A8] text-lg font-bold mb-3">{formatCurrency(plan.price, 'GHS')}</p>

          {/* Specs List */}
          <div className="text-[10px] text-[#94A3B8] space-y-1.5 mb-4 border-t border-b border-[#94A3B8]/10 py-2.5">
            <div className="flex justify-between">
              <span>Duration:</span>
              <span className="text-white font-semibold">{plan.duration} Days</span>
            </div>
            <div className="flex justify-between">
              <span>Daily Yield:</span>
              <span className="text-white font-semibold">{formatCurrency(plan.estimatedDailyReward, 'GHS')} ({(plan.rewardRate * 100).toFixed(0)}%)</span>
            </div>
            <div className="flex justify-between font-bold text-[#00D4A8]">
              <span>Total Est Yield:</span>
              <span>{formatCurrency(plan.estimatedTotalReward, 'GHS')}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div>
          <button
            onClick={() => onStartMining(plan)}
            disabled={isLoading || !canAfford}
            className={`w-full py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all ${
              !canAfford
                ? 'bg-[#0D1B2A] border border-slate-800 text-slate-500 cursor-not-allowed'
                : isFeatured
                ? 'bg-gradient-to-r from-[#00D4A8] to-[#2DD4FF] text-[#07111F] shadow-md shadow-[#00D4A8]/20 hover:brightness-110 active:scale-95'
                : 'bg-[#10253A] border border-[#00D4A8] text-[#00D4A8] hover:bg-[#00D4A8] hover:text-[#07111F] active:scale-95'
            }`}
          >
            {isLoading ? 'ACTIVATING...' : canAfford ? 'START MINING' : 'INSUFFICIENT BALANCE'}
          </button>
        </div>
      </div>
    );
  }
}

export default MiningPlanCard;

