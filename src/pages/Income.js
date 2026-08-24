import React, { Component } from 'react';
import { TrendingUp, Wallet, Zap, Cpu, ArrowLeft, RefreshCw, AlertCircle, Clock, Calendar, Timer, CheckCircle2 } from 'lucide-react';
import TransactionList from '../components/TransactionList';
import { formatCurrency, formatDate, formatRemainingTime } from '../utils/formatters';
import { incomeService, miningService } from '../services/api';

export class Income extends Component {
  constructor(props) {
    super(props);
    this.state = {
      incomeData: null,
      isLoading: true,
      isTicking: false,
      message: '',
    };
  }

  componentDidMount() {
    this.loadIncomeData();
  }

  componentDidUpdate(prevProps) {
    if (this.props.user && (!prevProps.user || prevProps.user.id !== this.props.user.id)) {
      this.loadIncomeData();
    }
  }

  async loadIncomeData() {
    const userId = this.props.user ? this.props.user.id : 'usr_demo_101';
    this.setState({ isLoading: true });
    try {
      const res = await incomeService.getIncomeData(userId);
      if (res.success) {
        this.setState({ incomeData: res, isLoading: false });
      }
    } catch (err) {
      console.error('Error fetching income data:', err);
      this.setState({ isLoading: false });
    }
  }

  async handleTickRewards() {
    const userId = this.props.user ? this.props.user.id : 'usr_demo_101';
    this.setState({ isTicking: true });
    try {
      const res = await miningService.tickRewards(userId);
      if (res.success) {
        this.setState({ message: res.message, isTicking: false });

        if (res.totalTickedReward > 0 && window.triggerJackpotCelebration) {
          window.triggerJackpotCelebration({
            type: 'mining_reward',
            amount: res.totalTickedReward,
            newBalance: res.user?.balance,
            title: '24H DAILY YIELD PROFIT!',
            message: `${res.totalTickedReward.toFixed(2)} GHS 24-hour yield credited directly to your spendable balance!`,
            currency: res.user?.currency || 'GHS',
          });
        }

        this.loadIncomeData();
        setTimeout(() => this.setState({ message: '' }), 4000);
      }
    } catch (err) {
      this.setState({ isTicking: false });
    }
  }

  render() {
    const { onNavigate } = this.props;
    const { incomeData, isLoading, isTicking, message } = this.state;

    return (
      <div id="income-page" className="space-y-5 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#10253A] pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('home')}
              className="p-2 rounded-lg bg-[#10253A] text-[#94A3B8] hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#00D4A8]" />
                <span>Income & Reward Ledger</span>
              </h2>
              <p className="text-[10px] text-[#94A3B8]">Yield log & earnings analytics</p>
            </div>
          </div>

          <button
            onClick={() => this.handleTickRewards()}
            disabled={isTicking}
            className="px-3 py-1.5 rounded-lg bg-[#00D4A8]/10 text-[#00D4A8] border border-[#00D4A8]/30 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 hover:bg-[#00D4A8]/20 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTicking ? 'animate-spin' : ''}`} />
            <span>Sync Yield</span>
          </button>
        </div>

        {message && (
          <div className="p-3 bg-[#00D4A8]/10 border border-[#00D4A8]/30 rounded-xl text-[#00D4A8] text-xs font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 fill-[#00D4A8]" />
            <span>{message}</span>
          </div>
        )}

        {/* Top Summary Cards Grid */}
        {isLoading || !incomeData ? (
          <div className="h-28 bg-[#10253A] rounded-xl animate-pulse"></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Available Balance */}
            <div className="bg-[#10253A]/50 p-4 rounded-xl border border-[#94A3B8]/10">
              <div className="flex items-center gap-2 text-[#94A3B8] text-[10px] font-bold uppercase tracking-wider mb-1">
                <Wallet className="w-3.5 h-3.5 text-[#00D4A8]" />
                <span>Available Balance</span>
              </div>
              <h3 className="text-2xl font-bold text-white">
                {formatCurrency(incomeData.balance, 'GHS')}
              </h3>
            </div>

            {/* Today's Estimated Reward */}
            <div className="bg-[#10253A]/50 p-4 rounded-xl border border-[#94A3B8]/10">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 text-[#94A3B8] text-[10px] font-bold uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>Today's Est. Reward</span>
                </div>
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#00D4A8]/10 text-[#00D4A8] font-bold uppercase">ACTIVE</span>
              </div>
              <h3 className="text-2xl font-bold text-[#00D4A8]">
                {formatCurrency(incomeData.todayEstReward, 'GHS')}
              </h3>
            </div>

            {/* Total Earned Rewards */}
            <div className="bg-[#10253A]/50 p-4 rounded-xl border border-[#94A3B8]/10">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 text-[#94A3B8] text-[10px] font-bold uppercase tracking-wider">
                  <TrendingUp className="w-3.5 h-3.5 text-[#2DD4FF]" />
                  <span>Total Earned Yield</span>
                </div>
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#2DD4FF]/10 text-[#2DD4FF] font-bold uppercase">LIFETIME</span>
              </div>
              <h3 className="text-2xl font-bold text-[#2DD4FF]">
                {formatCurrency(incomeData.totalRewards ?? incomeData.totalSimulatedRewards, 'GHS')}
              </h3>
            </div>
          </div>
        )}

        {/* Active Mining Rigs List */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#00D4A8]" />
            <span>Active Mining Contracts ({incomeData ? incomeData.activeContractsCount : 0})</span>
          </h3>

          {incomeData && incomeData.activeContracts.length > 0 ? (
            <div className="space-y-3">
              {incomeData.activeContracts.map((cntr) => {
                const remaining = formatRemainingTime(cntr.endDate);
                const startMs = new Date(cntr.startDate || cntr.createdAt).getTime();
                const endMs = new Date(cntr.endDate).getTime();
                const nowMs = Date.now();
                const totalDurationMs = Math.max(1, endMs - startMs);
                const elapsedMs = Math.max(0, Math.min(totalDurationMs, nowMs - startMs));
                const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedMs / totalDurationMs) * 100)));

                return (
                  <div key={cntr.id} className="bg-[#10253A] p-4 rounded-2xl border border-slate-800 space-y-3 shadow-md">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-extrabold text-white text-sm tracking-wide flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-[#00D4A8] fill-[#00D4A8]/20" />
                          <span>{cntr.planName}</span>
                        </h4>
                        <p className="text-[11px] text-[#94A3B8] mt-0.5">
                          Amount: <span className="text-white font-bold">{formatCurrency(cntr.amount, 'GHS')}</span> • Plan Duration: <span className="text-[#00D4A8] font-bold">{cntr.duration} Days</span>
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-[#00D4A8]/10 border border-[#00D4A8]/30 text-[#00D4A8] text-[10px] font-extrabold uppercase tracking-wider animate-pulse shrink-0">
                        ACTIVE MINING
                      </span>
                    </div>

                    {/* Contract Maturity & Timer Banner */}
                    <div className="bg-[#0D1B2A] p-3 rounded-xl border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs flex-wrap gap-1">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-[#2DD4FF]" />
                          <span className="text-[11px] text-slate-400">Maturity Date:</span>
                          <strong className="text-white font-bold text-[11px]">
                            {formatDate(cntr.endDate)}
                          </strong>
                        </div>

                        <div className="flex items-center gap-1.5 bg-[#10253A] px-2.5 py-1 rounded-lg border border-slate-700">
                          <Timer className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-[11px] text-amber-300 font-bold font-mono">
                            {remaining.text}
                          </span>
                        </div>
                      </div>

                      {/* Maturity Progress Bar */}
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                          <span>Mining Progress</span>
                          <span className="text-[#00D4A8] font-bold font-mono">{progressPercent}% Completed</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#00D4A8] to-[#2DD4FF] rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Yields Breakdown & 24h Cycle Info */}
                    <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-slate-800/80">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Daily Yield (24h)</span>
                        <span className="font-bold text-[#00D4A8] text-[11px]">
                          {formatCurrency(cntr.estimatedDailyReward, 'GHS')}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] text-slate-400 block">Total Est. Return</span>
                        <span className="font-bold text-white text-[11px]">
                          {formatCurrency(cntr.estimatedTotalReward || (cntr.estimatedDailyReward * cntr.duration), 'GHS')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Credited to Balance</span>
                        <span className="font-bold text-[#2DD4FF] text-[11px]">
                          {formatCurrency(cntr.accumulatedReward, 'GHS')}
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#0A1624] px-3 py-2 rounded-lg border border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#00D4A8]" />
                        <span>Daily yield credits directly to spendable balance every 24 hours until maturity ({cntr.duration} Days).</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 bg-[#10253A] rounded-2xl border border-slate-800 text-center">
              <p className="text-xs text-slate-400">No active mining contracts. Visit Home to start a miner.</p>
            </div>
          )}
        </div>

        {/* Transaction History Section */}
        <div className="space-y-3 pt-3 border-t border-[#10253A]">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Transaction Ledger</h3>
          <TransactionList transactions={incomeData ? incomeData.transactions : []} />
        </div>
      </div>
    );
  }
}

export default Income;
