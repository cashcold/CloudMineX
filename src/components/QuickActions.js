import React, { Component } from 'react';
import { CreditCard, ArrowUpRight, TrendingUp, Users } from 'lucide-react';

export class QuickActions extends Component {
  render() {
    const { onNavigate } = this.props;

    const actions = [
      { id: 'recharge', label: 'Recharge', icon: CreditCard, color: 'text-[#00D4A8]' },
      { id: 'withdraw', label: 'Withdraw', icon: ArrowUpRight, color: 'text-[#2DD4FF]' },
      { id: 'income', label: 'Yields', icon: TrendingUp, color: 'text-[#F59E0B]' },
      { id: 'team', label: 'Network', icon: Users, color: 'text-[#00D4A8]' },
    ];

    return (
      <div id="quick-actions-grid" className="grid grid-cols-4 gap-3 my-4">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              id={`quick-action-${act.id}`}
              onClick={() => onNavigate(act.id)}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#10253A]/50 border border-[#94A3B8]/10 hover:border-[#00D4A8]/30 active:scale-95 transition-all group"
            >
              <div className={`w-9 h-9 rounded-lg bg-[#07111F] border border-[#10253A] flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105 ${act.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-[#94A3B8] group-hover:text-white uppercase tracking-wider">{act.label}</span>
            </button>
          );
        })}
      </div>
    );
  }
}

export default QuickActions;

