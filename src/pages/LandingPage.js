import React, { Component } from 'react';
import { 
  Cloud, 
  Cpu, 
  Zap, 
  ShieldCheck, 
  TrendingUp, 
  ArrowRight, 
  Lock, 
  User, 
  UserPlus, 
  Phone, 
  Mail, 
  Gift, 
  CheckCircle2, 
  HelpCircle, 
  CreditCard, 
  Clock, 
  X,
  Play,
  Eye,
  EyeOff,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';
import { userService } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import LiveActivityStream from '../components/LiveActivityStream';

export class LandingPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isAuthModalOpen: false,
      authMode: 'login', // 'login' or 'register'
      
      // Login Form
      loginUsername: '',
      loginPassword: '',
      showLoginPassword: false,
      
      // Register Form
      regUsername: '',
      regPhone: '',
      regEmail: '',
      regPassword: '',
      regConfirmPassword: '',
      showRegPassword: false,
      showRegConfirmPassword: false,
      regRefCode: '',
      regPaymentMethod: 'mobile', // 'mobile', 'ethereum', 'btc', 'usdt'
      regPaymentAddress: '',

      // Calculator State
      calcAmount: 300,

      // UI States
      authLoading: false,
      authMessage: null,
      authError: null,
    };

    this.handleOpenAuth = this.handleOpenAuth.bind(this);
    this.handleCloseAuth = this.handleCloseAuth.bind(this);
    this.handleLoginSubmit = this.handleLoginSubmit.bind(this);
    this.handleRegisterSubmit = this.handleRegisterSubmit.bind(this);
    this.handleDemoLogin = this.handleDemoLogin.bind(this);
  }

  componentDidMount() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get('ref');
      if (refCode) {
        this.setState({
          regRefCode: refCode,
          isAuthModalOpen: true,
          authMode: 'register',
        });
      }
    } catch (e) {
      console.error('Error parsing referral URL parameter:', e);
    }
  }

  handleOpenAuth(mode = 'login') {
    this.setState({
      isAuthModalOpen: true,
      authMode: mode,
      authError: null,
      authMessage: null,
    });
  }

  handleCloseAuth() {
    this.setState({ isAuthModalOpen: false, authError: null, authMessage: null });
  }

  async handleLoginSubmit(e) {
    e.preventDefault();
    const { loginUsername, loginPassword } = this.state;
    if (!loginUsername) {
      this.setState({ authError: 'Please enter your username or phone number.' });
      return;
    }

    this.setState({ authLoading: true, authError: null, authMessage: null });

    try {
      const res = await userService.login(loginUsername, loginPassword);
      if (res.success && res.user) {
        this.setState({ authMessage: res.message });
        setTimeout(() => {
          this.props.onLoginSuccess(res.user);
        }, 600);
      } else {
        this.setState({ authError: res.message || 'Login failed.' });
      }
    } catch (err) {
      console.error('Login error:', err);
      this.setState({ authError: 'Connection error during login.' });
    } finally {
      this.setState({ authLoading: false });
    }
  }

  async handleRegisterSubmit(e) {
    e.preventDefault();
    const { regUsername, regPhone, regEmail, regPassword, regConfirmPassword, regRefCode, regPaymentMethod, regPaymentAddress } = this.state;
    if (!regUsername) {
      this.setState({ authError: 'Please enter a username.' });
      return;
    }

    if (!regPassword) {
      this.setState({ authError: 'Please enter a password.' });
      return;
    }

    if (regPassword !== regConfirmPassword) {
      this.setState({ authError: 'Passwords do not match. Please confirm your password.' });
      return;
    }

    this.setState({ authLoading: true, authError: null, authMessage: null });

    try {
      const methodLabels = {
        mobile: 'Mobile Payments',
        ethereum: 'Ethereum (ETH)',
        btc: 'Bitcoin (BTC)',
        usdt: 'USDT (TRC20/ERC20)',
      };

      const res = await userService.register({
        username: regUsername,
        phone: regPhone,
        email: regEmail,
        password: regPassword,
        referralCode: regRefCode,
        paymentMethod: methodLabels[regPaymentMethod] || 'Mobile Payments',
        paymentAddress: regPaymentAddress || regPhone || 'Not provided',
      });

      if (res.success && res.user) {
        this.setState({ authMessage: res.message });
        setTimeout(() => {
          this.props.onLoginSuccess(res.user);
        }, 800);
      } else {
        this.setState({ authError: res.message || 'Registration failed.' });
      }
    } catch (err) {
      console.error('Register error:', err);
      this.setState({ authError: 'Connection error during registration.' });
    } finally {
      this.setState({ authLoading: false });
    }
  }

  async handleDemoLogin() {
    this.setState({ authLoading: true, authError: null });
    try {
      const res = await userService.getDemoUser();
      if (res.user) {
        this.props.onLoginSuccess(res.user);
      }
    } catch (err) {
      console.error('Demo login error:', err);
      this.setState({ authError: 'Failed to launch demo account.' });
    } finally {
      this.setState({ authLoading: false });
    }
  }

  render() {
    const { 
      isAuthModalOpen, 
      authMode, 
      loginUsername, 
      loginPassword, 
      showLoginPassword,
      regUsername, 
      regPhone, 
      regEmail, 
      regPassword, 
      regConfirmPassword,
      showRegPassword,
      showRegConfirmPassword,
      regRefCode, 
      regPaymentMethod,
      regPaymentAddress,
      calcAmount,
      authLoading,
      authError,
      authMessage
    } = this.state;

    // Calculator projections
    const getDailyRate = (amt) => {
      if (amt >= 20000) return 0.12;
      if (amt >= 10000) return 0.11;
      if (amt >= 5000) return 0.10;
      if (amt >= 3000) return 0.09;
      if (amt >= 1500) return 0.08;
      if (amt >= 700) return 0.07;
      if (amt >= 300) return 0.06;
      return 0.05;
    };
    const dailyRate = getDailyRate(calcAmount);
    const calcDaily = (calcAmount * dailyRate).toFixed(2);
    const calcMonthly = (calcAmount * dailyRate * 30).toFixed(2);
    const calcTotal = (calcAmount * dailyRate * 60).toFixed(2);

    return (
      <div id="landing-page-root" className="min-h-screen bg-[#07111F] text-white font-sans selection:bg-[#00D4A8] selection:text-[#07111F]">
        {/* Top Announcement Bar */}
        <div id="landing-announcement" className="bg-gradient-to-r from-[#00D4A8] via-[#2DD4FF] to-[#00D4A8] py-1.5 px-4 text-center text-[#07111F] text-xs font-bold tracking-wide flex items-center justify-center gap-2">
          <Cloud className="w-4 h-4 fill-[#07111F] animate-bounce" />
          <span>☁️ NEW CLOUD RIGS ACTIVE: Register now & receive GHS 50.00 Free Mining Welcome Credit!</span>
          <button 
            onClick={() => this.handleOpenAuth('register')}
            className="underline hover:text-black font-extrabold ml-2 uppercase text-[11px]"
          >
            Claim Bonus &rarr;
          </button>
        </div>

        {/* Landing Navigation Header */}
        <header id="landing-navbar" className="sticky top-0 z-40 bg-[#0D1B2A]/95 backdrop-blur-md border-b border-[#10253A] px-4 sm:px-8 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#00D4A8] to-[#2DD4FF] rounded-lg flex items-center justify-center text-[#07111F] font-black text-xl shadow-md shadow-[#00D4A8]/20 shrink-0">
                <Cloud className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h1 className="text-xl font-black tracking-tight text-white">CloudMine<span className="text-[#00D4A8]">X</span></h1>
                  <span className="bg-[#00D4A8]/10 text-[#00D4A8] text-[9px] font-bold px-1.5 py-0.5 rounded border border-[#00D4A8]/20 uppercase">
                    Cloud ☁️ Rigs
                  </span>
                </div>
                <p className="text-[10px] text-[#94A3B8] uppercase tracking-widest -mt-0.5">Automated Hash Rate Protocol</p>
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center justify-center sm:justify-end gap-2.5 sm:gap-4 w-full sm:w-auto border-t sm:border-t-0 border-[#10253A] pt-2 sm:pt-0">
            <button
              onClick={() => this.handleOpenAuth('login')}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-lg border border-[#00D4A8]/40 text-xs font-bold text-[#00D4A8] hover:bg-[#00D4A8]/10 active:scale-95 transition-all uppercase tracking-wider flex items-center justify-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>

            <button
              onClick={() => this.handleOpenAuth('register')}
              className="flex-1 sm:flex-initial px-5 py-2 rounded-lg bg-gradient-to-r from-[#00D4A8] to-[#2DD4FF] text-[#07111F] text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-md shadow-[#00D4A8]/20 uppercase tracking-wider flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register</span>
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <section id="landing-hero" className="relative pt-12 pb-16 px-4 sm:px-8 max-w-6xl mx-auto overflow-hidden">
          {/* Ambient Glow Effects */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#00D4A8]/10 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute top-10 right-10 w-64 h-64 bg-[#2DD4FF]/10 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="text-center max-w-3xl mx-auto relative z-10">
            {/* Cloud Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10253A] border border-[#00D4A8]/30 text-[#00D4A8] text-xs font-bold uppercase tracking-widest mb-6 shadow-lg">
              <Cloud className="w-4 h-4 fill-[#00D4A8] text-[#00D4A8]" />
              <span>Next-Gen Cloud ☁️ Mining Infrastructure</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight mb-4">
              High-Density <span className="bg-gradient-to-r from-[#00D4A8] via-[#2DD4FF] to-[#00D4A8] bg-clip-text text-transparent">Cloud Mining</span> & Daily Yields
            </h1>

            <p className="text-sm sm:text-base text-[#94A3B8] max-w-2xl mx-auto leading-relaxed mb-8">
              No hardware maintenance, cooling costs, or technical noise. Rent enterprise-grade ASIC hash power and generate automated daily crypto rewards directly into your account.
            </p>

            {/* Primary Action Group */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8">
              <button
                onClick={() => this.handleOpenAuth('register')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#00D4A8] to-[#2DD4FF] text-[#07111F] text-sm font-extrabold shadow-xl shadow-[#00D4A8]/25 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 fill-[#07111F]" />
                <span>Start Mining Now (Register)</span>
              </button>

              <button
                onClick={() => this.handleOpenAuth('login')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#10253A] border border-[#00D4A8]/40 text-white text-sm font-bold hover:bg-[#10253A]/80 hover:border-[#00D4A8] active:scale-95 transition-all uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4 text-[#00D4A8]" />
                <span>Login to Account</span>
              </button>
            </div>

            {/* 24/7 Instant Payment & Service Banner */}
            <div id="landing-instant-banner" className="my-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0D1B2A] via-[#10253A] to-[#0D1B2A] border-2 border-[#00D4A8]/40 p-4 sm:p-5 shadow-2xl shadow-[#00D4A8]/10 text-left">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D4A8]/10 rounded-full blur-2xl pointer-events-none"></div>
              <div className="relative z-10 flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00D4A8]/20 to-[#2DD4FF]/20 border border-[#00D4A8]/50 flex items-center justify-center shrink-0 text-[#00D4A8] shadow-md shadow-[#00D4A8]/10">
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
                  <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-snug">
                    Instant Deposits & 24/7 Automated Payout Gateway
                  </h2>
                  <p className="text-xs text-[#94A3B8] leading-relaxed max-w-xl">
                    CloudMineX operates a 24-hour non-stop instant payment system. All Mobile Money (MTN, Telecel, AT) and USDT Crypto deposits & withdrawals are credited automatically in real time!
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-300 font-medium">
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
            </div>

            {/* Key Live Metrics Ticker */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#0D1B2A]/80 border border-[#10253A] backdrop-blur-md text-left">
              <div className="p-2.5">
                <div className="flex items-center gap-1.5 text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider mb-1">
                  <Cloud className="w-3.5 h-3.5 text-[#00D4A8]" />
                  <span>Cloud Hash Rate</span>
                </div>
                <p className="text-lg font-black text-white font-mono">248.50 TH/s</p>
              </div>

              <div className="p-2.5">
                <div className="flex items-center gap-1.5 text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider mb-1">
                  <Cpu className="w-3.5 h-3.5 text-[#2DD4FF]" />
                  <span>Active Cloud Rigs</span>
                </div>
                <p className="text-lg font-black text-white font-mono">18,420 Units</p>
              </div>

              <div className="p-2.5">
                <div className="flex items-center gap-1.5 text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-[#00D4A8]" />
                  <span>Total Yield Paid</span>
                </div>
                <p className="text-lg font-black text-[#00D4A8] font-mono">GHS 1.48M+</p>
              </div>

              <div className="p-2.5">
                <div className="flex items-center gap-1.5 text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>Uptime Guarantee</span>
                </div>
                <p className="text-lg font-black text-[#F59E0B] font-mono">99.98% SLA</p>
              </div>
            </div>
          </div>
        </section>

        {/* Cloud Mining Yield Calculator Section */}
        <section id="yield-calculator" className="py-12 px-4 sm:px-8 bg-[#0D1B2A]/60 border-y border-[#10253A]">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <span className="text-[#00D4A8] text-xs font-bold uppercase tracking-widest">Interactive Tool</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">Cloud ☁️ Mining Profit Calculator</h2>
              <p className="text-xs text-[#94A3B8] mt-1">Estimate your automated daily rewards based on selected mining hash power.</p>
            </div>

            <div className="bg-[#10253A] rounded-2xl p-6 border border-[#94A3B8]/10 shadow-2xl">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">
                    Select Investment Capital
                  </label>
                  <span className="text-lg font-bold text-[#00D4A8] font-mono">
                    {formatCurrency(calcAmount, 'GHS')}
                  </span>
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {[100, 300, 700, 1500, 3000, 5000, 10000, 20000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => this.setState({ calcAmount: amt })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        calcAmount === amt
                          ? 'bg-gradient-to-r from-[#00D4A8] to-[#2DD4FF] text-[#07111F] shadow'
                          : 'bg-[#07111F] text-[#94A3B8] hover:text-white border border-[#10253A]'
                      }`}
                    >
                      {formatCurrency(amt, 'GHS')}
                    </button>
                  ))}
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min="100"
                  max="20000"
                  step="100"
                  value={calcAmount}
                  onChange={(e) => this.setState({ calcAmount: Number(e.target.value) })}
                  className="w-full accent-[#00D4A8] cursor-pointer"
                />
              </div>

              {/* Projections Output Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#94A3B8]/10 text-center">
                <div className="bg-[#07111F] p-4 rounded-xl border border-[#10253A]">
                  <p className="text-[10px] text-[#94A3B8] uppercase font-bold tracking-wider mb-1">Est. Daily Reward</p>
                  <p className="text-xl font-bold text-[#00D4A8] font-mono">{formatCurrency(calcDaily, 'GHS')}</p>
                  <span className="text-[9px] text-[#94A3B8]">+{((calcDaily / calcAmount) * 100).toFixed(1)}% / Day</span>
                </div>

                <div className="bg-[#07111F] p-4 rounded-xl border border-[#10253A]">
                  <p className="text-[10px] text-[#94A3B8] uppercase font-bold tracking-wider mb-1">Est. 30-Day Reward</p>
                  <p className="text-xl font-bold text-[#2DD4FF] font-mono">{formatCurrency(calcMonthly, 'GHS')}</p>
                  <span className="text-[9px] text-[#94A3B8]">Monthly Yield</span>
                </div>

                <div className="bg-[#07111F] p-4 rounded-xl border border-[#10253A]">
                  <p className="text-[10px] text-[#94A3B8] uppercase font-bold tracking-wider mb-1">Est. 60-Day Total Yield</p>
                  <p className="text-xl font-bold text-amber-400 font-mono">{formatCurrency(calcTotal, 'GHS')}</p>
                  <span className="text-[9px] text-[#94A3B8]">Full Contract Cycle</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Cloud Rigs Section */}
        <section id="cloud-rigs-showcase" className="py-14 px-4 sm:px-8 max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-[#00D4A8] text-xs font-bold uppercase tracking-widest">Mining Rigs Portfolio</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">Enterprise Cloud ☁️ Rigs</h2>
              <p className="text-xs text-[#94A3B8] mt-1">High-efficiency mining algorithms optimized for maximum hash output.</p>
            </div>

            <button
              onClick={() => this.handleOpenAuth('register')}
              className="px-4 py-2 rounded-lg bg-[#10253A] border border-[#00D4A8]/30 text-[#00D4A8] text-xs font-bold hover:bg-[#00D4A8]/10 transition-all uppercase tracking-wider self-start sm:self-auto"
            >
              View All Contracts &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Rig 1 */}
            <div className="bg-[#10253A]/60 rounded-2xl p-5 border border-[#94A3B8]/10 hover:border-[#00D4A8]/40 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#07111F] border border-[#00D4A8]/30 flex items-center justify-center text-[#00D4A8]">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <span className="bg-[#00D4A8]/10 text-[#00D4A8] text-[9px] font-bold px-2 py-0.5 rounded border border-[#00D4A8]/30 uppercase">
                    Popular Entry
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-1">Starter Miner ☁️</h3>
                <p className="text-xs text-[#94A3B8] mb-4">Entry level cloud mining unit for steady daily rewards.</p>

                <div className="text-2xl font-black text-[#00D4A8] mb-4 font-mono">GHS 100.00</div>

                <div className="space-y-2 text-xs border-t border-[#94A3B8]/10 pt-3 text-[#94A3B8]">
                  <div className="flex justify-between">
                    <span>Daily Yield Rate:</span>
                    <span className="text-white font-bold">5.0% / Day</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="text-white font-bold">7 Days</span>
                  </div>
                  <div className="flex justify-between text-[#00D4A8] font-bold">
                    <span>Total Est. Return:</span>
                    <span>GHS 35.00</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => this.handleOpenAuth('register')}
                className="mt-6 w-full py-2.5 rounded-lg bg-[#00D4A8] text-[#07111F] font-extrabold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow"
              >
                Start Mining
              </button>
            </div>

            {/* Rig 2 - Featured */}
            <div className="bg-[#10253A] rounded-2xl p-5 border border-[#00D4A8]/50 ring-1 ring-[#00D4A8]/30 transition-all flex flex-col justify-between shadow-2xl relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#00D4A8] to-[#2DD4FF] text-[#07111F] text-[9px] font-black px-3 py-0.5 rounded-full uppercase tracking-widest shadow">
                ⚡ HIGH YIELD CHOICE
              </span>

              <div>
                <div className="flex justify-between items-start mb-3 mt-1">
                  <div className="w-10 h-10 rounded-lg bg-[#00D4A8] text-[#07111F] flex items-center justify-center font-bold">
                    <Zap className="w-6 h-6 fill-[#07111F]" />
                  </div>
                  <span className="bg-[#2DD4FF]/10 text-[#2DD4FF] text-[9px] font-bold px-2 py-0.5 rounded border border-[#2DD4FF]/30 uppercase">
                    700 GHS Plan
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-1">Pro Miner ☁️</h3>
                <p className="text-xs text-[#94A3B8] mb-4">High density cloud hash rig with accelerated daily payouts.</p>

                <div className="text-2xl font-black text-white mb-4 font-mono">GHS 700.00</div>

                <div className="space-y-2 text-xs border-t border-[#94A3B8]/10 pt-3 text-[#94A3B8]">
                  <div className="flex justify-between">
                    <span>Daily Yield Rate:</span>
                    <span className="text-[#00D4A8] font-bold">7.0% / Day</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="text-white font-bold">30 Days</span>
                  </div>
                  <div className="flex justify-between text-[#00D4A8] font-bold">
                    <span>Total Est. Return:</span>
                    <span>GHS 1,470.00</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => this.handleOpenAuth('register')}
                className="mt-6 w-full py-2.5 rounded-lg bg-gradient-to-r from-[#00D4A8] to-[#2DD4FF] text-[#07111F] font-extrabold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#00D4A8]/20"
              >
                Start Mining
              </button>
            </div>

            {/* Rig 3 */}
            <div className="bg-[#10253A]/60 rounded-2xl p-5 border border-[#94A3B8]/10 hover:border-[#00D4A8]/40 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#07111F] border border-[#00D4A8]/30 flex items-center justify-center text-[#2DD4FF]">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <span className="bg-[#F59E0B]/10 text-[#F59E0B] text-[9px] font-bold px-2 py-0.5 rounded border border-[#F59E0B]/30 uppercase">
                    TITAN MAX RIG
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-1">Titan Rig Miner ☁️</h3>
                <p className="text-xs text-[#94A3B8] mb-4">Ultra-high density industrial mining cluster for peak returns.</p>

                <div className="text-2xl font-black text-[#2DD4FF] mb-4 font-mono">GHS 20,000.00</div>

                <div className="space-y-2 text-xs border-t border-[#94A3B8]/10 pt-3 text-[#94A3B8]">
                  <div className="flex justify-between">
                    <span>Daily Yield Rate:</span>
                    <span className="text-white font-bold">12.0% / Day</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="text-white font-bold">180 Days</span>
                  </div>
                  <div className="flex justify-between text-[#2DD4FF] font-bold">
                    <span>Total Est. Return:</span>
                    <span>GHS 432,000.00</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => this.handleOpenAuth('register')}
                className="mt-6 w-full py-2.5 rounded-lg bg-[#10253A] border border-[#00D4A8] text-[#00D4A8] hover:bg-[#00D4A8] hover:text-[#07111F] font-extrabold text-xs uppercase tracking-wider active:scale-95 transition-all"
              >
                Start Mining
              </button>
            </div>
          </div>
        </section>

        {/* Live Network Activity Stream */}
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">
          <LiveActivityStream />
        </div>

        {/* Why CloudMineX 4-Step Process */}
        <section id="how-it-works" className="py-14 px-4 sm:px-8 bg-[#0D1B2A]/80 border-t border-[#10253A]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <span className="text-[#00D4A8] text-xs font-bold uppercase tracking-widest">3 Simple Steps</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">How Cloud ☁️ Mining Works</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#10253A]/50 p-6 rounded-2xl border border-[#94A3B8]/10 relative">
                <div className="w-8 h-8 rounded-full bg-[#00D4A8] text-[#07111F] font-black text-sm flex items-center justify-center mb-4">
                  1
                </div>
                <h3 className="text-base font-bold text-white mb-2">Create Account</h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  Sign up in less than 30 seconds. New accounts instantly receive GHS 50 welcome mining credit.
                </p>
              </div>

              <div className="bg-[#10253A]/50 p-6 rounded-2xl border border-[#94A3B8]/10 relative">
                <div className="w-8 h-8 rounded-full bg-[#2DD4FF] text-[#07111F] font-black text-sm flex items-center justify-center mb-4">
                  2
                </div>
                <h3 className="text-base font-bold text-white mb-2">Choose Cloud Rig</h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  Select a cloud contract matching your budget. Recharge via MTN MoMo, Telecel Cash, or USDT.
                </p>
              </div>

              <div className="bg-[#10253A]/50 p-6 rounded-2xl border border-[#94A3B8]/10 relative">
                <div className="w-8 h-8 rounded-full bg-amber-400 text-[#07111F] font-black text-sm flex items-center justify-center mb-4">
                  3
                </div>
                <h3 className="text-base font-bold text-white mb-2">Collect & Withdraw</h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  Daily rewards are automatically calculated and credited. Withdraw funds directly to your wallet anytime.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 sm:px-8 bg-[#07111F] border-t border-[#10253A] text-center text-xs text-[#94A3B8]">
          <div className="max-w-4xl mx-auto space-y-3">
            <div className="flex items-center justify-center gap-2 font-bold text-white">
              <Cloud className="w-4 h-4 text-[#00D4A8]" />
              <span>CloudMineX Digital Mining Platform</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              CloudMineX operates high-density enterprise cloud mining nodes. All returns and account balances are governed by automated protocol smart contracts.
            </p>
            <p className="text-[10px] text-[#94A3B8]/60">
              &copy; 2026 CloudMineX Inc. All Rights Reserved.
            </p>
          </div>
        </footer>

        {/* LOGIN & REGISTER MODAL */}
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="bg-[#0D1B2A] border border-[#10253A] rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
              {/* Close Button */}
              <button
                onClick={this.handleCloseAuth}
                className="absolute top-4 right-4 text-[#94A3B8] hover:text-white p-1 rounded-lg bg-[#10253A]"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Modal Tabs */}
              <div className="flex items-center gap-2 border-b border-[#10253A] pb-3 mb-5">
                <button
                  onClick={() => this.setState({ authMode: 'login', authError: null, authMessage: null })}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                    authMode === 'login'
                      ? 'bg-[#00D4A8] text-[#07111F]'
                      : 'bg-[#10253A] text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Login</span>
                </button>

                <button
                  onClick={() => this.setState({ authMode: 'register', authError: null, authMessage: null })}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                    authMode === 'register'
                      ? 'bg-gradient-to-r from-[#00D4A8] to-[#2DD4FF] text-[#07111F]'
                      : 'bg-[#10253A] text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </button>
              </div>

              {/* Error / Success Feedback */}
              {authError && (
                <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                  {authError}
                </div>
              )}
              {authMessage && (
                <div className="mb-4 p-3 rounded-lg bg-[#00D4A8]/10 border border-[#00D4A8]/30 text-[#00D4A8] text-xs font-medium">
                  {authMessage}
                </div>
              )}

              {/* LOGIN FORM */}
              {authMode === 'login' ? (
                <form onSubmit={this.handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                      Username / Phone
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="e.g. miner123 or 0241234567"
                        value={loginUsername}
                        onChange={(e) => this.setState({ loginUsername: e.target.value })}
                        className="w-full bg-[#10253A] border border-[#94A3B8]/20 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D4A8]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => this.setState({ loginPassword: e.target.value })}
                        className="w-full bg-[#10253A] border border-[#94A3B8]/20 rounded-xl py-2.5 pl-9 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D4A8]"
                      />
                      <button
                        type="button"
                        onClick={() => this.setState({ showLoginPassword: !showLoginPassword })}
                        className="absolute right-3 top-2.5 text-[#94A3B8] hover:text-white transition-colors p-1"
                        title={showLoginPassword ? 'Hide password' : 'Show password'}
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00D4A8] to-[#2DD4FF] text-[#07111F] font-extrabold text-xs uppercase tracking-wider hover:brightness-110 transition-all shadow-md"
                  >
                    {authLoading ? 'Signing In...' : 'LOG IN TO CLOUDMINE'}
                  </button>
                </form>
              ) : (
                /* REGISTER FORM */
                <form onSubmit={this.handleRegisterSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                      Full Name or Username *
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="e.g. John Miner"
                        value={regUsername}
                        onChange={(e) => this.setState({ regUsername: e.target.value })}
                        className="w-full bg-[#10253A] border border-[#94A3B8]/20 rounded-lg py-1.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D4A8]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="e.g. 024 123 4567"
                        value={regPhone}
                        onChange={(e) => this.setState({ regPhone: e.target.value })}
                        className="w-full bg-[#10253A] border border-[#94A3B8]/20 rounded-lg py-1.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D4A8]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-2.5" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={regPassword}
                        onChange={(e) => this.setState({ regPassword: e.target.value })}
                        className="w-full bg-[#10253A] border border-[#94A3B8]/20 rounded-lg py-1.5 pl-9 pr-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D4A8]"
                      />
                      <button
                        type="button"
                        onClick={() => this.setState({ showRegPassword: !showRegPassword })}
                        className="absolute right-2.5 top-2 text-[#94A3B8] hover:text-white transition-colors p-0.5"
                        title={showRegPassword ? 'Hide password' : 'Show password'}
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-2.5" />
                      <input
                        type={showRegConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={regConfirmPassword}
                        onChange={(e) => this.setState({ regConfirmPassword: e.target.value })}
                        className="w-full bg-[#10253A] border border-[#94A3B8]/20 rounded-lg py-1.5 pl-9 pr-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D4A8]"
                      />
                      <button
                        type="button"
                        onClick={() => this.setState({ showRegConfirmPassword: !showRegConfirmPassword })}
                        className="absolute right-2.5 top-2 text-[#94A3B8] hover:text-white transition-colors p-0.5"
                        title={showRegConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="pt-1">
                    <label className="block text-[10px] font-bold text-[#00D4A8] uppercase tracking-wider mb-1.5">
                      Preferred Payment / Payout Method *
                    </label>

                    <div className="grid grid-cols-2 gap-1.5 mb-2">
                      <button
                        type="button"
                        onClick={() => this.setState({ regPaymentMethod: 'mobile' })}
                        className={`p-2 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-all text-left ${
                          regPaymentMethod === 'mobile'
                            ? 'bg-[#00D4A8]/10 border-[#00D4A8] text-white shadow'
                            : 'bg-[#10253A] border-[#94A3B8]/20 text-[#94A3B8] hover:text-white'
                        }`}
                      >
                        <Phone className="w-3.5 h-3.5 text-[#00D4A8]" />
                        <span>Mobile Payments</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => this.setState({ regPaymentMethod: 'ethereum' })}
                        className={`p-2 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-all text-left ${
                          regPaymentMethod === 'ethereum'
                            ? 'bg-[#2DD4FF]/10 border-[#2DD4FF] text-white shadow'
                            : 'bg-[#10253A] border-[#94A3B8]/20 text-[#94A3B8] hover:text-white'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5 text-[#2DD4FF]" />
                        <span>Ethereum (ETH)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => this.setState({ regPaymentMethod: 'btc' })}
                        className={`p-2 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-all text-left ${
                          regPaymentMethod === 'btc'
                            ? 'bg-amber-500/10 border-amber-400 text-white shadow'
                            : 'bg-[#10253A] border-[#94A3B8]/20 text-[#94A3B8] hover:text-white'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                        <span>Bitcoin (BTC)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => this.setState({ regPaymentMethod: 'usdt' })}
                        className={`p-2 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-all text-left ${
                          regPaymentMethod === 'usdt'
                            ? 'bg-emerald-500/10 border-emerald-400 text-white shadow'
                            : 'bg-[#10253A] border-[#94A3B8]/20 text-[#94A3B8] hover:text-white'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>USDT (TRC20)</span>
                      </button>
                    </div>

                    {/* Dynamic Payment Account / Wallet Input */}
                    <div>
                      <label className="block text-[10px] text-[#94A3B8] font-bold mb-1">
                        {regPaymentMethod === 'mobile' && '📱 Enter Mobile Money Phone / Network (e.g., MTN MoMo 0241234567)'}
                        {regPaymentMethod === 'ethereum' && '🔷 Enter Ethereum (ETH) Wallet Address'}
                        {regPaymentMethod === 'btc' && '₿ Enter Bitcoin (BTC) Wallet Address'}
                        {regPaymentMethod === 'usdt' && '💲 Enter USDT Wallet Address (TRC20/ERC20)'}
                      </label>
                      <input
                        type="text"
                        placeholder={
                          regPaymentMethod === 'mobile' ? 'e.g. MTN MoMo 0241234567' :
                          regPaymentMethod === 'ethereum' ? 'e.g. 0x71C7656EC7ab88b098defB751B7401B5f6d8976F' :
                          regPaymentMethod === 'btc' ? 'e.g. 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' :
                          'e.g. TXp8a28f8XqH1d1k8j29J'
                        }
                        value={regPaymentAddress}
                        onChange={(e) => this.setState({ regPaymentAddress: e.target.value })}
                        className="w-full bg-[#10253A] border border-[#00D4A8]/40 rounded-lg py-1.5 px-3 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-[#00D4A8]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                      Referral Code (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CX9982"
                      value={regRefCode}
                      onChange={(e) => this.setState({ regRefCode: e.target.value })}
                      className="w-full bg-[#10253A] border border-[#94A3B8]/20 rounded-lg py-1.5 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D4A8]"
                    />
                  </div>

                  <div className="p-2 rounded-lg bg-[#00D4A8]/10 border border-[#00D4A8]/20 text-[10px] text-[#00D4A8] font-semibold flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5 text-[#00D4A8]" />
                    <span>Includes GHS 50 Welcome Free Mining Credit</span>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00D4A8] to-[#2DD4FF] text-[#07111F] font-extrabold text-xs uppercase tracking-wider hover:brightness-110 transition-all shadow-md"
                  >
                    {authLoading ? 'Creating Account...' : 'REGISTER ACCOUNT'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default LandingPage;
