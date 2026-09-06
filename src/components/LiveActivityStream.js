import React, { Component } from 'react';
import { TrendingUp, ArrowDownLeft, ArrowUpRight, ShieldCheck, Zap, X } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { activityService } from '../services/api';
import { getUniqueDynamicName } from '../data/usernamesPool';

function createInitialActivities() {
  const providersPool = [
    'Crypto (USDT - TRC20)',
    'Crypto (USDT - BEP20)',
    'Crypto (USDT)',
    'Crypto (BTC)',
    'Crypto (TRON)',
    'MTN MoMo',
    'Telecel Cash',
    'AT Money',
  ];
  const amountsPool = [180, 250, 320, 450, 580, 720, 850, 1000, 1250, 1500, 2200, 4500];
  const typesPool = ['payout', 'payout', 'payout', 'deposit'];

  return Array.from({ length: 6 }).map((_, i) => {
    const type = typesPool[i % typesPool.length];
    return {
      id: `init_act_${Date.now() - (i + 1) * 35000}_${i}`,
      type,
      isReal: false,
      username: getUniqueDynamicName(),
      amount: amountsPool[i % amountsPool.length],
      provider: providersPool[i % providersPool.length],
      currency: 'GHS',
      badge: type === 'deposit' ? 'LIVE RECHARGE' : 'LIVE PAYOUT',
      timestamp: new Date(Date.now() - (i + 1) * 35000).toISOString(),
    };
  });
}

export class LiveActivityStream extends Component {
  constructor(props) {
    super(props);
    const isDismissed = typeof window !== 'undefined' && Boolean(window.__cloudminexPopoutDismissed);
    this.state = {
      activities: createInitialActivities(),
      recentToast: null,
      toastVisible: false,
      isDismissed: isDismissed,
    };
    this.timer = null;
    this.simulationTimer = null;
    this.toastTimer = null;
    this.shownToastIds = new Set();
  }

  componentDidMount() {
    this.fetchStream();
    // Generate organic, realistic live transactions every 7 seconds
    this.simulationTimer = setInterval(() => this.generateLiveTransaction(), 7000);
    // Poll backend every 20 seconds to sync real withdrawals/deposits
    this.timer = setInterval(() => this.fetchStream(), 20000);
  }

  componentWillUnmount() {
    if (this.timer) clearInterval(this.timer);
    if (this.simulationTimer) clearInterval(this.simulationTimer);
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  generateLiveTransaction() {
    const providersPool = [
      'Crypto (USDT - TRC20)',
      'Crypto (USDT - BEP20)',
      'Crypto (USDT)',
      'Crypto (BTC)',
      'Crypto (TRON)',
      'MTN MoMo',
      'Telecel Cash',
      'AT Money',
    ];

    const amountsPool = [
      180, 250, 320, 450, 580, 720, 850, 1000, 1250, 1500, 1850, 2200, 3100, 4500, 5800
    ];
    
    // High ratio of payouts (75% payouts, 25% deposits)
    const typesPool = ['payout', 'payout', 'payout', 'deposit'];

    const randomName = getUniqueDynamicName();
    const randomProvider = providersPool[Math.floor(Math.random() * providersPool.length)];
    const randomAmount = amountsPool[Math.floor(Math.random() * amountsPool.length)];
    const randomType = typesPool[Math.floor(Math.random() * typesPool.length)];

    const newAct = {
      id: `gen_tx_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      type: randomType,
      isReal: false,
      username: randomName,
      amount: randomAmount,
      provider: randomProvider,
      currency: 'GHS',
      badge: randomType === 'deposit' ? 'LIVE RECHARGE' : 'LIVE PAYOUT',
      timestamp: new Date().toISOString(),
    };

    this.setState((prevState) => {
      const updated = [newAct, ...prevState.activities].slice(0, 15);
      return { activities: updated };
    });

    if (!this.state.isDismissed && !(typeof window !== 'undefined' && window.__cloudminexPopoutDismissed)) {
      this.triggerToast(newAct);
    }
  }

  async fetchStream() {
    try {
      const res = await activityService.getActivityStream();
      if (res && res.success && Array.isArray(res.activities) && res.activities.length > 0) {
        this.setState({ activities: res.activities });

        // Trigger toast for a fresh un-shown item if not dismissed
        if (!this.state.isDismissed && !(typeof window !== 'undefined' && window.__cloudminexPopoutDismissed)) {
          const unshown = res.activities.filter((act) => !this.shownToastIds.has(act.id));
          if (unshown.length > 0) {
            const toastItem = unshown[0];
            this.triggerToast(toastItem);
          }
        }
      }
    } catch {
      // Graceful fallback - activities are already seeded and live transactions continue generating
    }
  }

  triggerToast(item) {
    if (!item || this.state.isDismissed || (typeof window !== 'undefined' && window.__cloudminexPopoutDismissed)) {
      return;
    }
    this.shownToastIds.add(item.id);
    if (this.shownToastIds.size > 50) {
      // Keep set bounded
      const firstKey = this.shownToastIds.values().next().value;
      this.shownToastIds.delete(firstKey);
    }

    this.setState({ recentToast: item, toastVisible: true });
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.setState({ toastVisible: false });
    }, 4500);
  }

  handleDismissToast() {
    if (typeof window !== 'undefined') {
      window.__cloudminexPopoutDismissed = true;
    }
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.setState({ toastVisible: false, isDismissed: true });
  }

  render() {
    const { activities, recentToast, toastVisible, isDismissed } = this.state;

    return (
      <div id="live-activity-stream" className="space-y-3">
        {/* Stream Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D4A8] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00D4A8]"></span>
            </span>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Live Network Transactions Stream
            </h3>
          </div>
          <span className="text-[10px] text-[#00D4A8] font-bold bg-[#00D4A8]/10 px-2 py-0.5 rounded-full border border-[#00D4A8]/20">
            Real-time Activity
          </span>
        </div>

        {/* Ticker List */}
        <div className="bg-[#10253A] rounded-xl border border-slate-800 p-2.5 max-h-52 overflow-y-auto space-y-1.5 scrollbar-thin">
          {activities.length === 0 ? (
            <div className="text-center py-4 text-xs text-slate-500">Connecting to CloudMineX live transaction feed...</div>
          ) : (
            activities.slice(0, 10).map((act) => {
              const isDeposit = act.type === 'deposit';
              return (
                <div
                  key={act.id}
                  className={`p-2 rounded-lg flex items-center justify-between text-xs transition-all ${
                    act.isReal
                      ? 'bg-[#00D4A8]/10 border border-[#00D4A8]/30'
                      : 'bg-[#0D1B2A]/70 border border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                        isDeposit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'
                      }`}
                    >
                      {isDeposit ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white truncate max-w-[130px]">
                          {act.username}
                        </span>
                        {act.isReal ? (
                          <span className="text-[8px] font-black px-1.5 py-0.2 rounded bg-[#00D4A8] text-[#07111F] uppercase tracking-tighter">
                            VERIFIED REAL
                          </span>
                        ) : (
                          <span className="text-[8px] font-semibold px-1 py-0.2 rounded bg-slate-800 text-slate-400 uppercase">
                            {act.badge || 'LIVE'}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">
                        {isDeposit ? 'Recharged' : 'Withdrew'} via <span className="text-slate-300 font-medium">{act.provider}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`font-extrabold ${isDeposit ? 'text-emerald-400' : 'text-[#2DD4FF]'}`}>
                      {isDeposit ? '+' : '-'}{formatCurrency(act.amount, 'GHS')}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Floating Toast Popup */}
        {toastVisible && recentToast && !isDismissed && (
          <div className="fixed bottom-20 right-4 z-50 max-w-xs sm:max-w-sm bg-[#0D1B2A] border border-[#00D4A8]/60 rounded-xl p-3 shadow-2xl shadow-[#00D4A8]/20 animate-fade-in flex items-center gap-3 backdrop-blur-md">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#00D4A8] to-[#2DD4FF] flex items-center justify-center text-[#07111F] font-bold shrink-0 shadow-sm">
              <Zap className="w-4 h-4 fill-[#07111F]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[9px] font-extrabold text-[#00D4A8] uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00D4A8] animate-pulse"></span>
                  {recentToast.type === 'deposit' ? 'Recharge Confirmed' : 'Payout Confirmed'}
                </span>
                <button
                  onClick={() => this.handleDismissToast()}
                  className="text-slate-400 hover:text-white text-xs p-1 rounded hover:bg-slate-800 transition-colors"
                  title="Close popup"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs font-bold text-white truncate mt-0.5">
                <span className="text-[#2DD4FF]">{recentToast.username}</span> {recentToast.type === 'deposit' ? 'recharged' : 'withdrew'} <span className="text-[#00D4A8] font-black">{formatCurrency(recentToast.amount, 'GHS')}</span>
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                via <strong className="text-slate-300">{recentToast.provider}</strong> • <span className="text-slate-500">Just now</span>
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default LiveActivityStream;
