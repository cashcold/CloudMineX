import React, { Component } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Trophy, Zap, Wallet, CheckCircle, Volume2, VolumeX, ArrowRight, X } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { celebrationAudio } from '../utils/celebrationAudio';

export class JackpotCelebrationModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isMuted: celebrationAudio.getIsMuted(),
      displayAmount: 0,
      autoCloseTimer: 8,
    };
    this.confettiInterval = null;
    this.counterInterval = null;
    this.timerInterval = null;
  }

  componentDidMount() {
    this.triggerCelebrationEffects();
    this.animateAmountCounter();
    this.startAutoCloseCountdown();
  }

  componentWillUnmount() {
    if (this.confettiInterval) clearInterval(this.confettiInterval);
    if (this.counterInterval) clearInterval(this.counterInterval);
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  triggerCelebrationEffects() {
    // 1. Play victory sound
    celebrationAudio.playJackpotSound();

    // 2. Multi-stage confetti cannon burst
    try {
      // Immediate wide burst
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#00D4A8', '#FFD700', '#2DD4FF', '#FFFFFF', '#FFA500'],
      });

      // Left cannon
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 70,
          origin: { x: 0, y: 0.65 },
          colors: ['#FFD700', '#00D4A8', '#2DD4FF'],
        });
      }, 250);

      // Right cannon
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 70,
          origin: { x: 1, y: 0.65 },
          colors: ['#00D4A8', '#FFD700', '#2DD4FF'],
        });
      }, 450);

      // Golden stars rain
      setTimeout(() => {
        confetti({
          particleCount: 40,
          spread: 120,
          origin: { y: 0.3 },
          shapes: ['star'],
          colors: ['#FFD700', '#FFA500', '#FFFFFF'],
        });
      }, 800);
    } catch (e) {
      console.warn('Confetti effect unavailable:', e);
    }
  }

  animateAmountCounter() {
    const target = Number(this.props.amount) || 0;
    const duration = 1200; // 1.2s roll
    const steps = 24;
    const increment = target / steps;
    let current = 0;

    this.counterInterval = setInterval(() => {
      current += increment;
      if (current >= target) {
        this.setState({ displayAmount: target });
        clearInterval(this.counterInterval);
      } else {
        this.setState({ displayAmount: Number(current.toFixed(2)) });
      }
    }, duration / steps);
  }

  startAutoCloseCountdown() {
    this.timerInterval = setInterval(() => {
      this.setState((prev) => {
        if (prev.autoCloseTimer <= 1) {
          clearInterval(this.timerInterval);
          if (this.props.onClose) this.props.onClose();
          return { autoCloseTimer: 0 };
        }
        return { autoCloseTimer: prev.autoCloseTimer - 1 };
      });
    }, 1000);
  }

  toggleMute() {
    const newMuted = !this.state.isMuted;
    celebrationAudio.setMuted(newMuted);
    this.setState({ isMuted: newMuted });
  }

  render() {
    const { type, amount, newBalance, title, message, currency = 'GHS', onClose } = this.props;
    const { isMuted, displayAmount, autoCloseTimer } = this.state;

    const isDeposit = type === 'deposit';
    const isYield = type === 'mining_reward' || type === 'yield';

    const headerTitle = isDeposit
      ? 'DEPOSIT CONFIRMED!'
      : isYield
      ? '24H DAILY YIELD PROFIT!'
      : (title || 'ACCOUNT CREDITED!');

    const subtitleText = isDeposit
      ? 'Your account balance has been funded successfully!'
      : isYield
      ? 'Automated cloud mining profit credited to your spendable balance!'
      : (message || 'Your balance has been updated in real time.');

    return (
      <div 
        id="jackpot-celebration-overlay" 
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      >
        {/* Glowing Ambient Background Ring */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
          <div className="w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#00D4A8]/25 via-[#FFD700]/20 to-[#2DD4FF]/25 blur-[90px] animate-pulse" />
        </div>

        {/* Modal Window Container */}
        <div 
          id="jackpot-modal-card" 
          className="relative w-full max-w-md bg-[#0A1624] border-2 border-[#FFD700]/70 rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(255,215,0,0.35)] overflow-hidden"
        >
          {/* Top Controls: Sound & Close */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button
              onClick={() => this.toggleMute()}
              className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs"
              title={isMuted ? 'Unmute Victory Sound' : 'Mute Sound'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-[#00D4A8]" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Golden Badge Header */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-[#FFD700]/20 via-[#00D4A8]/20 to-[#FFD700]/20 border border-[#FFD700]/60 text-[#FFD700] text-[11px] font-black tracking-widest uppercase mb-4 shadow-sm animate-bounce">
            <Sparkles className="w-3.5 h-3.5 fill-[#FFD700]" />
            <span>{isDeposit ? '💰 RECHARGE CREDITED' : isYield ? '⚡ 24H MINING YIELD' : '🎉 JACKPOT VICTORY'}</span>
            <Sparkles className="w-3.5 h-3.5 fill-[#FFD700]" />
          </div>

          {/* Central Animated Trophy / Coin Emblem */}
          <div className="relative mx-auto w-24 h-24 mb-4 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#FFD700] via-[#FFA500] to-[#00D4A8] opacity-30 blur-md animate-ping" />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FFD700] via-[#F59E0B] to-[#00D4A8] p-0.5 shadow-2xl flex items-center justify-center transform hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#07111F] rounded-[14px] flex items-center justify-center">
                {isDeposit ? (
                  <Wallet className="w-10 h-10 text-[#00D4A8] drop-shadow-[0_0_12px_#00D4A8]" />
                ) : isYield ? (
                  <Zap className="w-10 h-10 text-[#FFD700] fill-[#FFD700] drop-shadow-[0_0_15px_#FFD700]" />
                ) : (
                  <Trophy className="w-10 h-10 text-[#FFD700] fill-[#FFD700] drop-shadow-[0_0_15px_#FFD700]" />
                )}
              </div>
            </div>
          </div>

          {/* Victory Heading */}
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
            {headerTitle}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto leading-relaxed">
            {subtitleText}
          </p>

          {/* Rolling Credited Amount Banner */}
          <div className="my-5 p-4 rounded-2xl bg-gradient-to-b from-[#10253A] to-[#0D1B2A] border border-[#00D4A8]/40 shadow-inner">
            <span className="text-[10px] uppercase tracking-widest text-[#94A3B8] font-bold block mb-1">
              Credited Amount
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#00D4A8] via-[#FFD700] to-[#2DD4FF] tracking-tight">
              +{formatCurrency(displayAmount, currency)}
            </div>

            {newBalance !== undefined && newBalance !== null && (
              <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-300">
                <CheckCircle className="w-3.5 h-3.5 text-[#00D4A8]" />
                <span>New Available Balance:</span>
                <strong className="text-white font-bold">{formatCurrency(newBalance, currency)}</strong>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="space-y-2">
            <button
              onClick={onClose}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#00D4A8] via-[#2DD4FF] to-[#00D4A8] text-[#07111F] font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-[#00D4A8]/30 hover:shadow-[#00D4A8]/50 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span>Collect & Celebrate</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-[10px] text-slate-500">
              Auto-closing in {autoCloseTimer}s • Enjoy your earnings!
            </p>
          </div>
        </div>
      </div>
    );
  }
}

export default JackpotCelebrationModal;
