import React, { Component } from 'react';
import { ArrowDownLeft, ArrowUpRight, Cpu, Gift, ShoppingBag, Clock } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

export class TransactionList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      filter: 'ALL',
    };
  }

  setFilter(filter) {
    this.setState({ filter });
  }

  render() {
    const { transactions = [] } = this.props;
    const { filter } = this.state;

    // Sort transactions by date descending (greater/newest date at top, older going down)
    const sortedTransactions = [...transactions].sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    const filtered = sortedTransactions.filter((tx) => {
      if (filter === 'ALL') return true;
      if (filter === 'MINING') return tx.type === 'mining_reward' || tx.type === 'mining_purchase';
      if (filter === 'DEPOSIT') return tx.type === 'deposit';
      if (filter === 'WITHDRAWAL') return tx.type === 'withdrawal';
      return true;
    });

    const getIcon = (type) => {
      switch (type) {
        case 'deposit':
          return <ArrowDownLeft className="w-3.5 h-3.5 text-[#00D4A8]" />;
        case 'withdrawal':
          return <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />;
        case 'mining_reward':
          return <Cpu className="w-3.5 h-3.5 text-[#2DD4FF]" />;
        case 'mining_purchase':
          return <ShoppingBag className="w-3.5 h-3.5 text-[#F59E0B]" />;
        case 'referral_reward':
          return <Gift className="w-3.5 h-3.5 text-purple-400" />;
        default:
          return <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />;
      }
    };

    return (
      <div id="transaction-list-container" className="space-y-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {['ALL', 'MINING', 'DEPOSIT', 'WITHDRAWAL'].map((f) => (
            <button
              key={f}
              onClick={() => this.setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                filter === f
                  ? 'bg-gradient-to-r from-[#00D4A8] to-[#2DD4FF] text-[#07111F] shadow'
                  : 'bg-[#10253A]/50 text-[#94A3B8] hover:text-white border border-[#94A3B8]/10'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* List Content */}
        {filtered.length === 0 ? (
          <div className="p-8 text-center bg-[#10253A]/30 rounded-xl border border-[#94A3B8]/10">
            <Clock className="w-6 h-6 text-[#94A3B8] mx-auto mb-2 opacity-50" />
            <p className="text-xs text-[#94A3B8]">No transaction records found for {filter}.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((tx) => (
              <div
                key={tx.id}
                className="bg-[#10253A]/50 p-3 rounded-xl border border-[#94A3B8]/10 flex items-center justify-between hover:border-[#00D4A8]/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#07111F] border border-[#10253A] flex items-center justify-center">
                    {getIcon(tx.type)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white leading-tight">{tx.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-[#94A3B8] font-mono">{tx.reference}</span>
                      <span className="text-[10px] text-[#94A3B8]/50">•</span>
                      <span className="text-[10px] text-[#94A3B8]">{formatDate(tx.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className={`text-xs font-bold font-mono ${
                      tx.type === 'deposit' || tx.type === 'mining_reward' || tx.type === 'referral_reward'
                        ? 'text-[#00D4A8]'
                        : 'text-rose-400'
                    }`}
                  >
                    {tx.type === 'deposit' || tx.type === 'mining_reward' || tx.type === 'referral_reward' ? '+' : '-'}
                    {formatCurrency(tx.amount, tx.currency || 'GHS')}
                  </p>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#07111F] text-[#94A3B8] font-medium uppercase tracking-wider border border-[#10253A]">
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
}

export default TransactionList;

