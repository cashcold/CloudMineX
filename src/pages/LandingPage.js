import React, { Component } from 'react';
import { 
  Cloud, 
  Cpu, 
  Zap, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
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
  ArrowUpRight,
  RefreshCw,
  Activity,
  KeyRound,
  Send,
  Check,
  RotateCcw
} from 'lucide-react';
import api, { userService } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import LiveActivityStream from '../components/LiveActivityStream';
import Statistics from '../components/Statistics';

class MarketTicker extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tickers: [
        { symbol: 'BTC', name: 'Bitcoin', price: 67450.2, change24h: 2.84 },
        { symbol: 'ETH', name: 'Ethereum', price: 3520.8, change24h: 1.92 },
        { symbol: 'USDT', name: 'Tether USD', price: 1.0001, change24h: 0.01 },
        { symbol: 'BNB', name: 'BNB Chain', price: 585.4, change24h: 3.15 },
        { symbol: 'SOL', name: 'Solana', price: 154.6, change24h: 4.8 },
        { symbol: 'TRX', name: 'TRON', price: 0.1284, change24h: 1.45 },
      ],
      lastUpdated: new Date().toLocaleTimeString(),
      updating: false,
      flashedSymbol: null,
    };
  }

  componentDidMount() {
    this.fetchMarketData();
    this.timer = setInterval(this.fetchMarketData, 5000);
  }

  componentWillUnmount() {
    if (this.timer) clearInterval(this.timer);
  }

  fetchMarketData = async () => {
    try {
      this.setState({ updating: true });
      const res = await api.get('/market/ticker');
      if (res.data && res.data.tickers) {
        const symbols = ['BTC', 'ETH', 'USDT'];
        const randomFlashed = symbols[Math.floor(Math.random() * symbols.length)];
        this.setState({
          tickers: res.data.tickers,
          lastUpdated: new Date().toLocaleTimeString(),
          flashedSymbol: randomFlashed,
        });
        setTimeout(() => this.setState({ flashedSymbol: null }), 1000);
      }
    } catch (err) {
      this.setState((prevState) => {
        const jitterBtc = (Math.random() - 0.48) * 12;
        const jitterEth = (Math.random() - 0.48) * 1.8;
        return {
          tickers: prevState.tickers.map((ticker) => {
            if (ticker.symbol === 'BTC') return { ...ticker, price: +(ticker.price + jitterBtc).toFixed(2) };
            if (ticker.symbol === 'ETH') return { ...ticker, price: +(ticker.price + jitterEth).toFixed(2) };
            return ticker;
          }),
          lastUpdated: new Date().toLocaleTimeString(),
        };
      });
    } finally {
      this.setState({ updating: false });
    }
  };

  formatPrice = (symbol, price) => {
    if (symbol === 'USDT') return `$${Number(price).toFixed(4)}`;
    return `$${Number(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  getSymbolBadge = (symbol) => {
    switch (symbol) {
      case 'BTC':
        return { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30', dot: 'bg-amber-400', icon: '₿' };
      case 'ETH':
        return { bg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30', dot: 'bg-cyan-400', icon: 'Ξ' };
      case 'USDT':
        return { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400', icon: '₮' };
      case 'BNB':
        return { bg: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30', dot: 'bg-fuchsia-400', icon: '⟠' };
      case 'SOL':
        return { bg: 'bg-sky-500/10 text-sky-300 border-sky-500/30', dot: 'bg-sky-400', icon: '◎' };
      default:
        return { bg: 'bg-rose-500/10 text-rose-300 border-rose-500/30', dot: 'bg-rose-400', icon: 'T' };
    }
  };

  renderCryptoCard = (item) => {
    const style = this.getSymbolBadge(item.symbol);
    const isPositive = item.change24h >= 0;
    const isFlashed = this.state.flashedSymbol === item.symbol;

    return (
      <div
        key={item.symbol}
        className={`rounded-2xl border px-3 py-2.5 transition-all duration-300 ${
          isFlashed
            ? 'border-[#00D4A8]/60 bg-[#00D4A8]/15 shadow-lg shadow-[#00D4A8]/10 scale-[1.01]'
            : 'border-[#10253A] bg-[#07111F]/80 hover:bg-[#0D1B2A]'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl border text-sm font-black ${style.bg}`}>
              {style.icon}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-black uppercase tracking-[0.2em] text-white">{item.symbol}</p>
              <p className="truncate text-[10px] text-[#94A3B8]">{item.name}</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm font-black text-white">{this.formatPrice(item.symbol, item.price)}</p>
            <div className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{isPositive ? '+' : ''}{item.change24h}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  render() {
    const { tickers, lastUpdated, updating } = this.state;
    const featuredTickers = tickers.filter((ticker) => ['BTC', 'ETH', 'USDT'].includes(ticker.symbol));
    const secondaryTickers = tickers.filter((ticker) => !['BTC', 'ETH', 'USDT'].includes(ticker.symbol));
    const orderedTickers = [...featuredTickers, ...secondaryTickers];

    return (
      <div className="mt-8 rounded-[24px] border border-[#00D4A8]/20 bg-[#0D1B2A]/80 p-4 sm:p-5 shadow-2xl shadow-[#00D4A8]/10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-2xl border border-[#00D4A8]/30 bg-[#00D4A8]/10 p-2 text-[#00D4A8]">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#00D4A8]">Live Crypto Market</p>
              <h3 className="text-lg font-black text-white">Digital Asset Pulse</h3>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-[#10253A] bg-[#07111F]/80 px-3 py-1.5 text-[11px] font-semibold text-slate-300">
            <RefreshCw className={`h-3.5 w-3.5 ${updating ? 'animate-spin' : ''}`} />
            <span>{lastUpdated}</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {orderedTickers.map((ticker) => this.renderCryptoCard(ticker))}
        </div>
      </div>
    );
  }
}

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

      // Forgot & Reset Password Form
      forgotEmailOrUsername: '',
      forgotStep: 1, // 1: request OTP, 2: verify OTP & set new password
      forgotCode: '',
      forgotNewPassword: '',
      forgotConfirmPassword: '',
      showForgotNewPassword: false,
      showForgotConfirmPassword: false,
      forgotTargetEmail: '',

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
    this.handleRequestResetOtp = this.handleRequestResetOtp.bind(this);
    this.handleVerifyAndResetPassword = this.handleVerifyAndResetPassword.bind(this);
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
      const errMsg = err?.response?.data?.message || err?.message || 'Connection error during login.';
      this.setState({ authError: errMsg });
    } finally {
      this.setState({ authLoading: false });
    }
  }

  async handleRegisterSubmit(e) {
    e.preventDefault();
    const { regUsername, regPhone, regEmail, regPassword, regConfirmPassword, regRefCode, regPaymentMethod, regPaymentAddress } = this.state;
    if (!regUsername || !regUsername.trim()) {
      this.setState({ authError: 'Please enter a username.' });
      return;
    }

    if (!regEmail || !regEmail.trim()) {
      this.setState({ authError: 'Please enter a valid email address for OTP verification and recovery.' });
      return;
    }

    if (!regEmail.includes('@') || !regEmail.includes('.')) {
      this.setState({ authError: 'Please enter a valid email format (e.g. miner@gmail.com).' });
      return;
    }

    if (!regPassword) {
      this.setState({ authError: 'Please enter a password.' });
      return;
    }

    if (regPassword.length < 4) {
      this.setState({ authError: 'Password must be at least 4 characters long.' });
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
        username: regUsername.trim(),
        phone: regPhone ? regPhone.trim() : '',
        email: regEmail.trim(),
        password: regPassword,
        referralCode: regRefCode ? regRefCode.trim() : '',
        paymentMethod: methodLabels[regPaymentMethod] || 'Mobile Payments',
        paymentAddress: regPaymentAddress ? regPaymentAddress.trim() : regPhone || 'Not provided',
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
      const errMsg = err?.response?.data?.message || err?.message || 'Connection error during registration.';
      this.setState({ authError: errMsg });
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

  async handleRequestResetOtp(e) {
    if (e && e.preventDefault) e.preventDefault();
    const { forgotEmailOrUsername } = this.state;

    if (!forgotEmailOrUsername || !forgotEmailOrUsername.trim()) {
      this.setState({ authError: 'Please enter your registered username, email, or phone number.' });
      return;
    }

    this.setState({ authLoading: true, authError: null, authMessage: null });

    try {
      const res = await userService.forgotPassword(forgotEmailOrUsername.trim());
      if (res.success) {
        this.setState({
          forgotStep: 2,
          forgotTargetEmail: res.email || forgotEmailOrUsername,
          authMessage: res.message || 'A 6-digit code has been sent to your email.',
        });
      } else {
        this.setState({ authError: res.message || 'Failed to send verification code.' });
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      const errMsg = err?.response?.data?.message || 'Connection error. Please try again.';
      this.setState({ authError: errMsg });
    } finally {
      this.setState({ authLoading: false });
    }
  }

  async handleVerifyAndResetPassword(e) {
    if (e && e.preventDefault) e.preventDefault();
    const { forgotEmailOrUsername, forgotCode, forgotNewPassword, forgotConfirmPassword } = this.state;

    if (!forgotCode || forgotCode.trim().length !== 6) {
      this.setState({ authError: 'Please enter the 6-digit code sent to your email.' });
      return;
    }

    if (!forgotNewPassword || forgotNewPassword.length < 4) {
      this.setState({ authError: 'New password must be at least 4 characters long.' });
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      this.setState({ authError: 'New passwords do not match. Please re-enter.' });
      return;
    }

    this.setState({ authLoading: true, authError: null, authMessage: null });

    try {
      const res = await userService.resetPassword({
        emailOrUsername: forgotEmailOrUsername.trim(),
        code: forgotCode.trim(),
        newPassword: forgotNewPassword,
      });

      if (res.success) {
        this.setState({
          authMessage: res.message || 'Password successfully updated! Logging you in...',
        });
        setTimeout(() => {
          if (res.user) {
            this.props.onLoginSuccess(res.user);
          } else {
            this.setState({
              authMode: 'login',
              loginUsername: forgotEmailOrUsername,
              loginPassword: forgotNewPassword,
              forgotStep: 1,
              forgotCode: '',
              forgotNewPassword: '',
              forgotConfirmPassword: '',
            });
          }
        }, 1200);
      } else {
        this.setState({ authError: res.message || 'Failed to reset password.' });
      }
    } catch (err) {
      console.error('Reset password error:', err);
      const errMsg = err?.response?.data?.message || 'Verification error. Please check the code.';
      this.setState({ authError: errMsg });
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
      forgotEmailOrUsername,
      forgotStep,
      forgotCode,
      forgotNewPassword,
      forgotConfirmPassword,
      showForgotNewPassword,
      showForgotConfirmPassword,
      forgotTargetEmail,
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
        <section id="landing-hero" className="relative pt-6 pb-8 px-4 sm:px-8 max-w-6xl mx-auto overflow-hidden">
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

            <Statistics />

            {/* Key Live Metrics Ticker */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#0D1B2A]/80 border border-[#10253A] backdrop-blur-md text-left">
              <div className="p-2.5">
                <div className="flex items-center gap-1.5 text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider mb-1">
                  <Cloud className="w-3.5 h-3.5 text-[#00D4A8]" />
                  <span>Cloud Hash Rate</span>
                </div>
                <p className="text-lg font-black text-white font-mono">748.50 TH/s</p>
              </div>

              <div className="p-2.5">
                <div className="flex items-center gap-1.5 text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider mb-1">
                  <Cpu className="w-3.5 h-3.5 text-[#2DD4FF]" />
                  <span>Active Cloud Rigs</span>
                </div>
                <p className="text-lg font-black text-white font-mono">58,420 Units</p>
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

          <MarketTicker />
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

                <button
                  onClick={() => this.setState({ authMode: 'forgot', authError: null, authMessage: null, forgotStep: 1 })}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                    authMode === 'forgot'
                      ? 'bg-amber-400 text-[#07111F]'
                      : 'bg-[#10253A] text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Reset</span>
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => this.setState({ authMode: 'forgot', forgotEmailOrUsername: loginUsername, authError: null, authMessage: null, forgotStep: 1 })}
                        className="text-[11px] text-[#00D4A8] hover:underline font-semibold"
                      >
                        Forgot password?
                      </button>
                    </div>
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
              ) : authMode === 'forgot' ? (
                /* FORGOT & RESET PASSWORD VIA 6-DIGIT EMAIL CODE */
                <div className="space-y-4">
                  {forgotStep === 1 ? (
                    <form onSubmit={this.handleRequestResetOtp} className="space-y-3">
                      <div className="p-3 rounded-xl bg-[#10253A] border border-[#94A3B8]/10 text-xs text-[#94A3B8] leading-relaxed">
                        Enter your registered <strong className="text-white">username, email address, or phone number</strong>. We will send a secure <strong className="text-[#00D4A8]">6-digit verification code</strong> to your email.
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                          Username or Email Address *
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
                          <input
                            type="text"
                            placeholder="e.g. miner123 or user@gmail.com"
                            value={forgotEmailOrUsername}
                            onChange={(e) => this.setState({ forgotEmailOrUsername: e.target.value })}
                            className="w-full bg-[#10253A] border border-[#94A3B8]/20 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D4A8]"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-[#07111F] font-extrabold text-xs uppercase tracking-wider hover:brightness-110 transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        <span>{authLoading ? 'Sending 6-Digit Code...' : 'SEND 6-DIGIT VERIFICATION CODE'}</span>
                      </button>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => this.setState({ authMode: 'login', authError: null, authMessage: null })}
                          className="text-xs text-[#94A3B8] hover:text-white transition-colors"
                        >
                          &larr; Back to Login
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* STEP 2: VERIFY 6-DIGIT OTP & ENTER NEW PASSWORD */
                    <form onSubmit={this.handleVerifyAndResetPassword} className="space-y-3">
                      <div className="p-3 rounded-xl bg-[#00D4A8]/10 border border-[#00D4A8]/30 text-xs text-[#00D4A8] leading-relaxed flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <span>A 6-digit verification code was sent to </span>
                          <strong className="text-white underline">{forgotTargetEmail}</strong>.
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                          6-Digit Verification Code *
                        </label>
                        <div className="relative">
                          <KeyRound className="w-4 h-4 text-amber-400 absolute left-3 top-3" />
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="e.g. 123456"
                            value={forgotCode}
                            onChange={(e) => this.setState({ forgotCode: e.target.value.replace(/[^0-9]/g, '') })}
                            className="w-full bg-[#10253A] border-2 border-amber-400/50 rounded-xl py-2.5 pl-9 pr-3 text-sm tracking-widest font-mono text-center text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                          New Password *
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
                          <input
                            type={showForgotNewPassword ? 'text' : 'password'}
                            placeholder="Enter new password (min 4 chars)"
                            value={forgotNewPassword}
                            onChange={(e) => this.setState({ forgotNewPassword: e.target.value })}
                            className="w-full bg-[#10253A] border border-[#94A3B8]/20 rounded-xl py-2.5 pl-9 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D4A8]"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => this.setState({ showForgotNewPassword: !showForgotNewPassword })}
                            className="absolute right-3 top-2.5 text-[#94A3B8] hover:text-white transition-colors p-1"
                          >
                            {showForgotNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                          Confirm New Password *
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
                          <input
                            type={showForgotConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm new password"
                            value={forgotConfirmPassword}
                            onChange={(e) => this.setState({ forgotConfirmPassword: e.target.value })}
                            className="w-full bg-[#10253A] border border-[#94A3B8]/20 rounded-xl py-2.5 pl-9 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D4A8]"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => this.setState({ showForgotConfirmPassword: !showForgotConfirmPassword })}
                            className="absolute right-3 top-2.5 text-[#94A3B8] hover:text-white transition-colors p-1"
                          >
                            {showForgotConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00D4A8] to-[#2DD4FF] text-[#07111F] font-extrabold text-xs uppercase tracking-wider hover:brightness-110 transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        <span>{authLoading ? 'Updating Password...' : 'VERIFY & UPDATE PASSWORD'}</span>
                      </button>

                      <div className="flex items-center justify-between pt-2 text-xs">
                        <button
                          type="button"
                          onClick={() => this.setState({ forgotStep: 1, authError: null, authMessage: null })}
                          className="text-[#94A3B8] hover:text-white transition-colors flex items-center gap-1"
                        >
                          &larr; Change Email
                        </button>
                        <button
                          type="button"
                          onClick={this.handleRequestResetOtp}
                          disabled={authLoading}
                          className="text-[#00D4A8] hover:underline font-semibold flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Resend Code</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
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
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                      Email Address * <span className="text-[#00D4A8] font-normal lowercase">(for 6-digit OTP reset)</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-2.5" />
                      <input
                        type="email"
                        placeholder="e.g. miner@gmail.com"
                        value={regEmail}
                        onChange={(e) => this.setState({ regEmail: e.target.value })}
                        className="w-full bg-[#10253A] border border-[#94A3B8]/20 rounded-lg py-1.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D4A8]"
                        required
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
