import React, { Component } from 'react';
import { ArrowUpRight, Wallet, ShieldAlert, ArrowLeft, Check, AlertCircle, Zap } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { userService, withdrawalService } from '../services/api';

export class Withdraw extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: null,
      amount: '',
      destination: '',
      provider: 'MTN MoMo',
      withdrawals: [],
      isSubmitting: false,
      errorMessage: '',
      successMessage: '',
      depositRequired: false,
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

      if (currentUser) {
        const wdsRes = await withdrawalService.getUserWithdrawals(currentUser.id);
        this.setState({
          user: currentUser,
          withdrawals: wdsRes.withdrawals || [],
        });
      }
    } catch (err) {
      console.error('Error loading withdrawal data:', err);
    }
  }

  async handleSubmitWithdrawal() {
    const { user, amount, destination, provider } = this.state;
    if (!user) return;

    if (!amount || Number(amount) <= 0) {
      this.setState({ errorMessage: 'Please enter a valid withdrawal amount.' });
      return;
    }

    if (!destination.trim()) {
      this.setState({ errorMessage: 'Please enter a valid payout address or mobile money number.' });
      return;
    }

    this.setState({ isSubmitting: true, errorMessage: '', successMessage: '' });

    try {
      const res = await withdrawalService.submitDemoWithdrawal(user.id, amount, destination, provider);
      if (res.success) {
        this.setState({
          user: res.user,
          successMessage: res.message,
          amount: '',
          destination: '',
          isSubmitting: false,
        });

        // Refresh list
        const wdsRes = await withdrawalService.getUserWithdrawals(user.id);
        this.setState({ withdrawals: wdsRes.withdrawals || [] });
      }
    } catch (err) {
      const isDepReq = err.response?.data?.depositRequired || false;
      const msg = err.response?.data?.message || 'Failed to submit withdrawal request.';
      this.setState({ errorMessage: msg, depositRequired: isDepReq, isSubmitting: false });
    }
  }

  render() {
    const { onNavigate } = this.props;
    const { user, amount, destination, provider, withdrawals, isSubmitting, errorMessage, successMessage, depositRequired } = this.state;

    return (
      <div id="withdraw-page" className="space-y-5 pb-10">
        {/* Top Bar */}
        <div className="flex items-center justify-between border-b border-[#10253A] pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('home')}
              className="p-2 rounded-lg bg-[#10253A] text-[#94A3B8] hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Payout & Withdrawal</h2>
          </div>

          {user && (
            <div className="text-right">
              <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Available Balance</span>
              <p className="text-sm font-bold text-[#00D4A8]">{formatCurrency(user.balance, user.currency)}</p>
            </div>
          )}
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/40 rounded-2xl text-rose-300 text-xs font-semibold space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-rose-200">Withdrawal Notice</p>
                  <p className="text-rose-300 text-[11px] mt-0.5 leading-relaxed">{errorMessage}</p>
                </div>
              </div>
              <button onClick={() => this.setState({ errorMessage: '', depositRequired: false })} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {depositRequired && (
              <button
                onClick={() => onNavigate('recharge')}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-500 to-emerald-400 text-slate-950 font-black text-xs uppercase rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <span>MAKE FIRST DEPOSIT NOW (MIN GHS 100)</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-[#00D4A8]/10 border border-[#00D4A8]/30 rounded-xl text-[#00D4A8] text-xs font-semibold flex items-center justify-between">
            <span>{successMessage}</span>
            <button onClick={() => this.setState({ successMessage: '' })}>✕</button>
          </div>
        )}

        {/* 24/7 Instant Service Banner */}
        <div className="p-3 bg-gradient-to-r from-[#00D4A8]/10 via-[#2DD4FF]/10 to-[#00D4A8]/10 border border-[#00D4A8]/30 rounded-2xl flex items-center gap-3">
          <Zap className="w-5 h-5 text-[#00D4A8] shrink-0 fill-[#00D4A8]" />
          <div className="text-xs">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white uppercase tracking-wider">⚡ 24/7 Instant Automated Payout Engine</span>
              <span className="px-1.5 py-0.5 rounded bg-[#00D4A8] text-[#07111F] text-[9px] font-black">24/7 ONLINE</span>
            </div>
            <p className="text-[#94A3B8] text-[11px] mt-0.5">
              Withdrawal requests are processed automatically 24/7 with zero waiting time!
            </p>
          </div>
        </div>

        {/* First Deposit Rule Notice Banner */}
        <div className="bg-gradient-to-r from-amber-500/10 to-emerald-500/10 p-3.5 rounded-2xl border border-amber-500/30 flex items-start gap-3">
          <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-amber-300">Welcome Bonus & Payout Rule</p>
            <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
              To cash out your GHS 50 Welcome Bonus and daily mining yields, you must make at least <span className="text-amber-400 font-bold">1 First Deposit (minimum GHS 100)</span> to activate your payout channel.
            </p>
          </div>
        </div>

        {/* Withdrawal Form */}
        <div className="bg-[#10253A] p-5 rounded-2xl border border-slate-800 space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#94A3B8] uppercase block mb-2">
              Payout Channel
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['MTN MoMo', 'Telecel Cash', 'Crypto Wallet'].map((p) => (
                <button
                  key={p}
                  onClick={() => this.setState({ provider: p })}
                  className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                    provider === p
                      ? 'bg-[#00D4A8]/20 border-[#00D4A8] text-[#00D4A8]'
                      : 'bg-[#0D1B2A] border-slate-800 text-slate-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#94A3B8] uppercase block mb-2">
              Withdrawal Amount (GHS)
            </label>
            <input
              type="number"
              placeholder="e.g. 100.00"
              value={amount}
              onChange={(e) => this.setState({ amount: e.target.value })}
              className="w-full bg-[#0D1B2A] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D4A8]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#94A3B8] uppercase block mb-2">
              Destination ({provider.includes('Crypto') ? 'Crypto Address' : 'Mobile Money Phone Number'})
            </label>
            <input
              type="text"
              placeholder={provider.includes('Crypto') ? 'Enter BTC/ETH/USDT Address' : 'Enter MoMo Number e.g. +233 24 000 0000'}
              value={destination}
              onChange={(e) => this.setState({ destination: e.target.value })}
              className="w-full bg-[#0D1B2A] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D4A8]"
            />
          </div>

          <button
            onClick={() => this.handleSubmitWithdrawal()}
            disabled={isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-[#00D4A8] via-[#2DD4FF] to-[#00D4A8] text-[#07111F] font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 fill-[#07111F]" />
            <span>{isSubmitting ? 'Processing Instant Payout...' : 'INSTANT WITHDRAWAL (24/7 AUTOMATED PAYOUT)'}</span>
          </button>
        </div>

        {/* Withdrawal History */}
        <div className="space-y-3 pt-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Demo Withdrawal History</h3>

          {withdrawals.length === 0 ? (
            <div className="p-6 bg-[#10253A] rounded-2xl border border-slate-800 text-center">
              <p className="text-xs text-slate-400">No demo withdrawal records submitted yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {withdrawals.map((wd) => (
                <div key={wd.id} className="bg-[#10253A] p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">{wd.provider} - {wd.destination}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(wd.createdAt)} • Ref: {wd.reference}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-rose-400">-{formatCurrency(wd.amount, wd.currency)}</p>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold uppercase">
                      {wd.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default Withdraw;
