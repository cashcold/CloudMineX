import React, { Component } from 'react';
import {
  Cpu,
  Zap,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  MessageSquare,
  Cloud,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Timer,
  Calendar,
  RefreshCw,
  Activity,
  Sparkles,
} from 'lucide-react';
import BalanceCard from '../components/BalanceCard';
import QuickActions from '../components/QuickActions';
import MiningPlanCard from '../components/MiningPlanCard';
import LiveActivityStream from '../components/LiveActivityStream';
import { userService, miningService } from '../services/api';

const formatCurrency = (amount, currency = 'GHS') => {
  return `${currency} ${Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: null,
      plans: [],
      userContracts: [],
      isLoading: true,
      isTicking: false,
      activePlanId: null,
      errorMessage: '',
      successMessage: '',
      currentTime: Date.now(),
    };
    this.timerInterval = null;
  }

  componentDidMount() {
    this.loadData();
    this.timerInterval = setInterval(() => {
      this.setState({ currentTime: Date.now() });
    }, 1000);
  }

  componentWillUnmount() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.user && (!prevProps.user || prevProps.user.id !== this.props.user.id)) {
      this.loadData();
    }
  }

  async loadData() {
    this.setState({ isLoading: true, errorMessage: '' });
    try {
      let currentUser = this.props.user;
      if (!currentUser) {
        const userRes = await userService.getDemoUser();
        currentUser = userRes.user;
      } else {
        const userRes = await userService.getUser(currentUser.id);
        if (userRes && userRes.user) {
          currentUser = userRes.user;
        }
      }

      const plansRes = await miningService.getPlans();
      if (currentUser) {
        const contractsRes = await miningService.getUserContracts(currentUser.id);
        this.setState({
          user: currentUser,
          plans: plansRes.plans || [],
          userContracts: contractsRes.contracts || [],
          isLoading: false,
        });
      }
    } catch (err) {
      console.error('Error loading Home data:', err);
      this.setState({
        errorMessage: 'Failed to connect to CloudMineX node. Check backend server.',
        isLoading: false,
      });
    }
  }

  async handleStartMining(plan) {
    const { user, activePlanId } = this.state;
    if (!user || activePlanId) return;

    this.setState({ activePlanId: plan.id, errorMessage: '', successMessage: '' });

    try {
      const res = await miningService.startContract(user.id, plan.id);
      if (res.success) {
        this.setState({
          user: res.user,
          successMessage: res.message,
          activePlanId: null,
        });
        // Reload user contracts
        const contractsRes = await miningService.getUserContracts(user.id);
        this.setState({ userContracts: contractsRes.contracts || [] });

        // Clear success message after 4s
        setTimeout(() => this.setState({ successMessage: '' }), 4000);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to start mining contract';
      this.setState({ errorMessage: msg, activePlanId: null });
    }
  }

  async handleTickRewards() {
    const { user } = this.state;
    if (!user) return;

    this.setState({ isTicking: true, errorMessage: '', successMessage: '' });
    try {
      const res = await miningService.tickRewards(user.id);
      if (res.success) {
        this.setState({
          user: res.user,
          successMessage: res.message,
          isTicking: false,
        });

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

        // Refresh contracts to reflect updated accumulatedReward
        const contractsRes = await miningService.getUserContracts(user.id);
        if (contractsRes && contractsRes.contracts) {
          this.setState({ userContracts: contractsRes.contracts });
        }

        setTimeout(() => this.setState({ successMessage: '' }), 4000);
      }
    } catch (err) {
      this.setState({ errorMessage: 'Error updating mining rewards', isTicking: false });
    }
  }

  render() {
    const { onNavigate } = this.props;
    const { user, plans, userContracts, isLoading, activePlanId, errorMessage, successMessage, isTicking, currentTime } = this.state;
    const activeContracts = (userContracts || []).filter((c) => c.status === 'active');

    return (
      <div id="home-page" className="space-y-5 pb-10">
        {/* 24/7 Instant Payment & Service Top Banner */}
        <section id="instant-payment-top-banner" className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0D1B2A] via-[#10253A] to-[#0D1B2A] border-2 border-[#00D4A8]/40 p-4 shadow-xl shadow-[#00D4A8]/5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D4A8]/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="relative z-10 flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#00D4A8]/20 to-[#2DD4FF]/20 border border-[#00D4A8]/50 flex items-center justify-center shrink-0 text-[#00D4A8] shadow-md shadow-[#00D4A8]/10">
              <Zap className="w-6 h-6 fill-[#00D4A8]" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#00D4A8]/15 text-[#00D4A8] border border-[#00D4A8]/30 text-[10px] font-black uppercase tracking-wider">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D4A8] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D4A8]"></span>
                  </span>
                  24/7 INSTANT SERVICE ONLINE
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#2DD4FF]/10 text-[#2DD4FF] border border-[#2DD4FF]/30 text-[10px] font-bold uppercase">
                  ⚡ ZERO DELAY
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-snug">
                Instant Deposits & 24/7 Automated Payout Gateway
              </h2>
              <p className="text-xs text-[#94A3B8] leading-relaxed max-w-xl">
                CloudMineX operates a 24-hour non-stop instant payment system. All Mobile Money (MTN, Telecel, AT) and USDT Crypto deposits & withdrawals are credited automatically in real time!
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] text-slate-300 font-medium">
                <span className="flex items-center gap-1 text-[#00D4A8]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Instant Recharges
                </span>
                <span className="flex items-center gap-1 text-[#2DD4FF]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Direct Payouts
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <Clock className="w-3.5 h-3.5" /> 24 Hours / 7 Days
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Alerts Banner */}
        {errorMessage && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => this.setState({ errorMessage: '' })} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-[#00D4A8]/10 border border-[#00D4A8]/30 rounded-xl text-[#00D4A8] text-xs font-semibold flex items-center justify-between animate-bounce">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 shrink-0 fill-[#00D4A8]" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => this.setState({ successMessage: '' })} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Hero Banner */}
        <section id="hero-banner" className="relative rounded-xl bg-[#10253A]/50 p-5 border border-[#94A3B8]/10 shadow-lg overflow-hidden">
          <div className="relative z-10 max-w-md">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#00D4A8]/10 text-[#00D4A8] text-[10px] font-bold border border-[#00D4A8]/20 mb-2 uppercase tracking-wider">
              <Zap className="w-3 h-3 fill-[#00D4A8]" />
              <span>Digital Mining Rig Engine</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight">
              Cloud Mining Platform
            </h1>

            <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed">
              Activate high-density cloud miners and observe automated daily yields directly inside your dashboard.
            </p>

            <div className="flex items-center gap-2.5 mt-4">
              <a
                href="#plans-section"
                className="py-2 px-3.5 rounded-lg bg-gradient-to-r from-[#00D4A8] to-[#2DD4FF] text-[#07111F] font-bold text-xs uppercase shadow-md hover:brightness-110 transition-all flex items-center gap-1"
              >
                Explore Plans
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => onNavigate('income')}
                className="py-2 px-3.5 rounded-lg bg-[#07111F] border border-[#00D4A8]/30 text-white font-bold text-xs uppercase hover:bg-[#00D4A8]/10 transition-all flex items-center gap-1"
              >
                <TrendingUp className="w-3.5 h-3.5 text-[#2DD4FF]" />
                My Yields
              </button>
            </div>
          </div>
        </section>

        {/* Balance Card Section */}
        <BalanceCard
          user={user}
          onNavigate={onNavigate}
          onTickRewards={() => this.handleTickRewards()}
          isTicking={isTicking}
        />

        {/* Quick Actions */}
        <QuickActions onNavigate={onNavigate} />

        {/* ================= ACTIVE CLOUD MINING RIGS SECTION ================= */}
        <section id="active-miners-section" className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#00D4A8]/20 border border-[#00D4A8]/40 flex items-center justify-center text-[#00D4A8]">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-white text-sm tracking-wider uppercase">Active Mining Rigs</h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#00D4A8]/20 border border-[#00D4A8]/40 text-[#00D4A8] text-[10px] font-extrabold uppercase">
                    {activeContracts.length} {activeContracts.length === 1 ? 'Unit' : 'Units'} Online
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">High-density cloud hashrate generating 24h daily automated yields</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => this.handleTickRewards()}
                disabled={isTicking}
                className="px-2.5 py-1.5 rounded-lg bg-[#10253A] border border-[#00D4A8]/30 text-[#00D4A8] text-xs font-bold hover:bg-[#00D4A8]/10 transition-all flex items-center gap-1"
                title="Synchronize & Collect 24h Yield"
              >
                <RefreshCw className={`w-3 h-3 ${isTicking ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Sync Yield</span>
              </button>
              <button
                onClick={() => onNavigate('income')}
                className="px-2.5 py-1.5 rounded-lg bg-[#07111F] border border-slate-700 text-slate-300 text-xs font-bold hover:text-white hover:border-[#00D4A8]/50 transition-all flex items-center gap-1"
              >
                <span>Ledger</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {activeContracts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {activeContracts.map((cntr) => {
                const startMs = new Date(cntr.startDate || cntr.createdAt).getTime();
                const ONE_DAY_MS = 24 * 60 * 60 * 1000;
                const elapsedSinceStart = Math.max(0, currentTime - startMs);
                const nextCycleTime = startMs + (Math.floor(elapsedSinceStart / ONE_DAY_MS) + 1) * ONE_DAY_MS;
                const diffMs = Math.max(0, nextCycleTime - currentTime);

                const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
                const minsLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                const secsLeft = Math.floor((diffMs % (1000 * 60)) / 1000);
                const countdownText = `${String(hoursLeft).padStart(2, '0')}h ${String(minsLeft).padStart(2, '0')}m ${String(secsLeft).padStart(2, '0')}s`;

                const durationDays = cntr.duration || 7;
                const totalDurationMs = durationDays * ONE_DAY_MS;
                const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedSinceStart / totalDurationMs) * 100)));
                const daysPassed = Math.min(durationDays, Math.floor(elapsedSinceStart / ONE_DAY_MS));

                return (
                  <div
                    key={cntr.id}
                    className="relative overflow-hidden bg-gradient-to-br from-[#10253A] to-[#0D1B2A] p-4 rounded-2xl border-2 border-[#00D4A8]/30 shadow-lg shadow-[#00D4A8]/5 space-y-3.5 hover:border-[#00D4A8]/60 transition-all"
                  >
                    {/* Glowing corner indicator */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#00D4A8]/10 rounded-full blur-xl pointer-events-none" />

                    {/* Top Row: Plan info & status */}
                    <div className="flex items-start justify-between gap-2 relative z-10">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Zap className="w-4 h-4 text-[#00D4A8] fill-[#00D4A8]" />
                          <h4 className="font-extrabold text-white text-sm tracking-wide">{cntr.planName}</h4>
                        </div>
                        <p className="text-[11px] text-[#94A3B8] mt-0.5">
                          Hash Capacity: <strong className="text-white">{formatCurrency(cntr.amount, user?.currency || 'GHS')}</strong> • Duration: <strong className="text-[#00D4A8]">{durationDays} Days</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00D4A8]/10 border border-[#00D4A8]/40 shrink-0">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D4A8] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D4A8]"></span>
                        </span>
                        <span className="text-[#00D4A8] text-[9px] font-extrabold uppercase tracking-wider">
                          HASHING 24/7
                        </span>
                      </div>
                    </div>

                    {/* Middle Countdown & Yield Box */}
                    <div className="bg-[#07111F]/80 p-3 rounded-xl border border-slate-800 space-y-2 relative z-10">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-[11px] text-slate-400">Next Daily Yield:</span>
                          <span className="text-amber-300 font-mono font-bold text-xs">{countdownText}</span>
                        </div>

                        <div className="flex items-center gap-1 text-[#00D4A8] font-extrabold text-xs">
                          <span>+{formatCurrency(cntr.estimatedDailyReward, user?.currency || 'GHS')}</span>
                          <span className="text-[9px] text-[#94A3B8]">/ 24h</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>Cycle Progress (Day {Math.min(durationDays, daysPassed + 1)} of {durationDays})</span>
                          <span className="text-[#2DD4FF] font-bold font-mono">{progressPercent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#00D4A8] to-[#2DD4FF] rounded-full transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bottom stats row & quick action */}
                    <div className="flex items-center justify-between pt-1 text-xs relative z-10">
                      <div>
                        <p className="text-[10px] text-slate-400">Accumulated Credited</p>
                        <p className="font-extrabold text-[#00D4A8] text-xs">
                          {formatCurrency(cntr.accumulatedReward || 0, user?.currency || 'GHS')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => this.handleTickRewards()}
                          disabled={isTicking}
                          className="px-2.5 py-1 rounded-lg bg-[#00D4A8] text-[#07111F] font-extrabold text-[10px] uppercase hover:brightness-110 active:scale-95 transition-all flex items-center gap-1 shadow-sm"
                        >
                          <Zap className="w-2.5 h-2.5 fill-[#07111F]" />
                          <span>Sync Yield</span>
                        </button>
                        <button
                          onClick={() => onNavigate('income')}
                          className="px-2 py-1 rounded-lg bg-[#10253A] border border-slate-700 text-slate-300 hover:text-white font-bold text-[10px] uppercase transition-all"
                        >
                          Ledger
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-[#10253A]/60 p-4 rounded-2xl border border-slate-800 text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-[#00D4A8]/10 border border-[#00D4A8]/30 flex items-center justify-center text-[#00D4A8]">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <p className="text-white text-xs font-bold">No Active Cloud Rigs Running</p>
                <p className="text-[10px] text-slate-400 max-w-sm mx-auto mt-0.5">
                  Select a mining contract below to deploy dedicated cloud hashpower and start receiving automated 24-hour yields directly to your balance.
                </p>
              </div>
              <a
                href="#plans-section"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#00D4A8] to-[#2DD4FF] text-[#07111F] font-extrabold text-xs uppercase hover:brightness-110 transition-all shadow-md mt-1"
              >
                <span>Deploy Miner Below</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          )}
        </section>

        {/* Live Activity Stream (Fake & Real Payouts & Deposits) */}
        <LiveActivityStream />

        {/* Community Chat Banner Button */}
        <div className="bg-gradient-to-r from-[#10253A] to-[#0D1B2A] p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00D4A8]/20 border border-[#00D4A8]/40 flex items-center justify-center text-[#00D4A8]">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Community Payout Claims & Chat</h3>
              <p className="text-[10px] text-slate-400">See real-time user payout proofs and chat with active miners</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('chat')}
            className="py-2 px-3 bg-[#00D4A8] text-[#07111F] font-extrabold text-xs uppercase rounded-xl hover:brightness-110 transition-all flex items-center gap-1 shrink-0"
          >
            <span>JOIN CHAT</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* How Cloud Mining Works Section */}
        <section id="how-it-works-home" className="p-5 rounded-2xl bg-[#10253A]/60 border border-slate-800 space-y-4">
          <div className="text-center">
            <span className="text-[#00D4A8] text-[10px] font-bold uppercase tracking-widest">3 Simple Steps</span>
            <h2 className="text-base font-extrabold text-white flex items-center justify-center gap-1.5 mt-0.5">
              <Cloud className="w-4 h-4 text-[#00D4A8]" />
              <span>How Cloud ☁️ Mining Works</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-[#07111F] p-4 rounded-xl border border-slate-800 relative">
              <div className="w-7 h-7 rounded-full bg-[#00D4A8] text-[#07111F] font-black text-xs flex items-center justify-center mb-2.5">
                1
              </div>
              <h3 className="text-xs font-bold text-white mb-1">Create Account</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Sign up in less than 30 seconds. New accounts instantly receive GHS 50 welcome mining credit.
              </p>
            </div>

            <div className="bg-[#07111F] p-4 rounded-xl border border-slate-800 relative">
              <div className="w-7 h-7 rounded-full bg-[#2DD4FF] text-[#07111F] font-black text-xs flex items-center justify-center mb-2.5">
                2
              </div>
              <h3 className="text-xs font-bold text-white mb-1">Choose Cloud Rig</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Select a cloud contract matching your budget. Recharge via MTN MoMo, Telecel Cash, or USDT.
              </p>
            </div>

            <div className="bg-[#07111F] p-4 rounded-xl border border-slate-800 relative">
              <div className="w-7 h-7 rounded-full bg-amber-400 text-[#07111F] font-black text-xs flex items-center justify-center mb-2.5">
                3
              </div>
              <h3 className="text-xs font-bold text-white mb-1">Collect & Withdraw</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Daily rewards are automatically calculated and credited. Withdraw funds directly to your wallet anytime.
              </p>
            </div>
          </div>
        </section>

        {/* Mining Plans Section */}
        <section id="plans-section" className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#94A3B8] flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#00D4A8]" />
                <span>Cloud Mining Contracts</span>
              </h2>
              <p className="text-[10px] text-[#94A3B8]/70">Select a rig hash-rate capacity to generate daily yields</p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-64 bg-[#10253A] rounded-2xl border border-slate-800 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <MiningPlanCard
                  key={plan.id}
                  plan={plan}
                  userBalance={user ? user.balance : 0}
                  isLoading={activePlanId === plan.id}
                  onStartMining={(p) => this.handleStartMining(p)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }
}

export default Home;
