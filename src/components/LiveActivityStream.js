import React, { Component } from 'react';
import { TrendingUp, ArrowDownLeft, ArrowUpRight, ShieldCheck, Zap } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { activityService } from '../services/api';
import { USERNAMES_POOL } from '../data/usernamesPool';

const cleanName = (raw) => {
  if (!raw) return 'User';
  return raw.trim().split(' ')[0].split('_')[0];
};

export class LiveActivityStream extends Component {
  constructor(props) {
    super(props);
    // Check if user dismissed popout in the current page session
    const isDismissed = typeof window !== 'undefined' && Boolean(window.__cloudminexPopoutDismissed);
    this.state = {
      activities: [],
      recentToast: null,
      toastVisible: false,
      isDismissed: isDismissed,
    };
    this.timer = null;
    this.simulationTimer = null;
    this.toastTimer = null;
  }

  componentDidMount() {
    this.fetchStream();
    // Generate a realistic live transaction every 5 seconds
    this.simulationTimer = setInterval(() => this.generateLiveTransaction(), 5000);
    // Poll backend every 15 seconds to sync real withdrawals/deposits
    this.timer = setInterval(() => this.fetchStream(), 15000);
  }

  componentWillUnmount() {
    if (this.timer) clearInterval(this.timer);
    if (this.simulationTimer) clearInterval(this.simulationTimer);
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  generateLiveTransaction() {
    const namesPool = USERNAMES_POOL && USERNAMES_POOL.length > 0 ? USERNAMES_POOL : [
      'Agyekum', 'Prempeh', 'Kwame', 'Abena', 'Kofi', 'Emmanuel', 'Rita', 'Daniel', 'Grace', 'Belinda', 'Bob', 'Frank'
    ];
    // High representation of Crypto as requested
    const providersPool = [
      'Crypto (USDT)',
      'Crypto (USDT - TRC20)',
      'Crypto (USDT - BEP20)',
      'Crypto (USDT)',
      'Crypto (BTC)',
      'Crypto (TRON)',
      'MTN MoMo',
      'Telecel Cash',
      'AT Money',
    ];
    const amountsPool = [250, 350, 480, 500, 650, 720, 850, 1000, 1200, 1500, 1850, 2200, 3100, 4500];
    const typesPool = ['payout', 'payout', 'deposit', 'payout', 'payout', 'deposit'];

    const randomRawName = namesPool[Math.floor(Math.random() * namesPool.length)];
    const randomName = cleanName(randomRawName);
    const randomProvider = providersPool[Math.floor(Math.random() * providersPool.length)];
    const randomAmount = amountsPool[Math.floor(Math.random() * amountsPool.length)];
    const randomType = typesPool[Math.floor(Math.random() * typesPool.length)];

    const newAct = {
      id: `gen_tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
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
      const updated = [newAct, ...prevState.activities].slice(0, 12);
      return { activities: updated };
    });

    if (!this.state.isDismissed && !(typeof window !== 'undefined' && window.__cloudminexPopoutDismissed)) {
      this.triggerToast(newAct);
    }
  }

  async fetchStream() {
    try {
      const res = await activityService.getActivityStream();
      if (res.success && res.activities) {
        this.setState({ activities: res.activities });

        // Pick a top activity for floating toast notification if not dismissed
        if (!this.state.isDismissed && !(typeof window !== 'undefined' && window.__cloudminexPopoutDismissed)) {
          if (res.activities.length > 0) {
            const randomIndex = Math.floor(Math.random() * Math.min(3, res.activities.length));
            const toastItem = res.activities[randomIndex];
            this.triggerToast(toastItem);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching activity stream:', err);
    }
  }

  triggerToast(item) {
    if (this.state.isDismissed || (typeof window !== 'undefined' && window.__cloudminexPopoutDismissed)) {
      return;
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
        <div className="bg-[#10253A] rounded-xl border border-slate-800 p-2.5 max-h-48 overflow-y-auto space-y-1.5 scrollbar-thin">
          {activities.length === 0 ? (
            <div className="text-center py-4 text-xs text-slate-500">Connecting to CloudMineX live transaction feed...</div>
          ) : (
            activities.slice(0, 8).map((act) => {
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
                        <span className="font-bold text-white truncate max-w-[110px]">
                          {cleanName(act.username)}
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
          <div className="fixed bottom-20 right-4 z-50 max-w-xs bg-[#0D1B2A] border border-[#00D4A8] rounded-xl p-3 shadow-2xl shadow-[#00D4A8]/20 animate-fade-in flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00D4A8] to-[#2DD4FF] flex items-center justify-center text-[#07111F] font-bold shrink-0">
              <Zap className="w-4 h-4 fill-[#07111F]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-extrabold text-[#00D4A8] uppercase tracking-wider">
                  {recentToast.type === 'deposit' ? '🟢 RECHARGE ALERT' : '🔵 PAYOUT CONFIRMED'}
                </span>
                <button
                  onClick={() => this.handleDismissToast()}
                  className="text-slate-400 hover:text-white text-xs px-1 py-0.5 rounded hover:bg-slate-800 transition-colors"
                  title="Close alert"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs font-bold text-white truncate mt-0.5">
                {cleanName(recentToast.username)} {recentToast.type === 'deposit' ? 'recharged' : 'withdrew'} {formatCurrency(recentToast.amount, 'GHS')}
              </p>
              <p className="text-[10px] text-slate-400 truncate">via <strong className="text-slate-300">{recentToast.provider}</strong></p>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default LiveActivityStream;
