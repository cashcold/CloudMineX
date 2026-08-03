import React, { Component } from 'react';
import { Cpu, Zap, ArrowRight, TrendingUp, AlertCircle, MessageSquare, Cloud, Clock, CheckCircle2, ArrowUpRight, ArrowDownLeft, ShieldCheck } from 'lucide-react';
import BalanceCard from '../components/BalanceCard';
import QuickActions from '../components/QuickActions';
import MiningPlanCard from '../components/MiningPlanCard';
import LiveActivityStream from '../components/LiveActivityStream';
import { userService, miningService } from '../services/api';

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
    };
  }

  componentDidMount() {
    this.loadData();
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
    const { user } = this.state;
    if (!user) return;

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
        setTimeout(() => this.setState({ successMessage: '' }), 4000);
      }
    } catch (err) {
      this.setState({ errorMessage: 'Error updating mining rewards', isTicking: false });
    }
  }

  render() {
    const { onNavigate } = this.props;
    const { user, plans, isLoading, activePlanId, errorMessage, successMessage, isTicking } = this.state;

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
