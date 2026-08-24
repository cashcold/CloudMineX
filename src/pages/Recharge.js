import React, { Component } from 'react';
import { CreditCard, QrCode, Copy, Check, ShieldAlert, ArrowLeft, RefreshCw, Zap, Wallet } from 'lucide-react';
import QRCodeDisplay from '../components/QRCodeDisplay';
import { formatCurrency, truncateAddress } from '../utils/formatters';
import { userService, depositService } from '../services/api';

export class Recharge extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: null,
      activeTab: 'MOMO', // MOMO or CRYPTO
      momoProvider: 'Vodafone Cash',
      momoAmount: 100,
      customMomoAmount: '',
      cryptoCurrency: 'BTC', // BTC (first), ETH, USDT
      cryptoNetwork: 'Bitcoin', // Bitcoin, ERC-20, TRC-20, BEP-20
      cryptoAmountFiat: 300,
      cryptoInfo: null,
      momoPaymentResult: null,
      cryptoPaymentResult: null,
      isSubmitting: false,
      copiedField: null,
      successMessage: '',
      errorMessage: '',
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
      const cryptoRes = await depositService.getCryptoInfo();
      this.setState({
        user: currentUser,
        cryptoInfo: cryptoRes,
      });
    } catch (err) {
      console.error('Error loading Recharge page data:', err);
    }
  }

  handleCopy(text, fieldName) {
    navigator.clipboard.writeText(text);
    this.setState({ copiedField: fieldName });
    setTimeout(() => this.setState({ copiedField: null }), 2000);
  }

  async handleCreateMomoDeposit() {
    const { user, momoProvider, momoAmount, customMomoAmount } = this.state;
    if (!user) return;

    const finalAmount = customMomoAmount ? Number(customMomoAmount) : Number(momoAmount);
    if (!finalAmount || finalAmount < 100) {
      this.setState({ errorMessage: 'Minimum deposit amount is GHS 100.' });
      return;
    }

    this.setState({ isSubmitting: true, errorMessage: '', successMessage: '' });

    try {
      const res = await depositService.createMobileMoneyDeposit(user.id, momoProvider, finalAmount);
      if (res.success) {
        this.setState({
          momoPaymentResult: res,
          isSubmitting: false,
          successMessage: 'Payment instructions created! Please make transfer to complete deposit.',
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create Mobile Money deposit request.';
      this.setState({ errorMessage: msg, isSubmitting: false });
    }
  }

  async handleCreateCryptoDeposit() {
    const { user, cryptoCurrency, cryptoNetwork, cryptoAmountFiat } = this.state;
    if (!user) return;

    if (!cryptoAmountFiat || Number(cryptoAmountFiat) < 100) {
      this.setState({ errorMessage: 'Minimum deposit amount is GHS 100.' });
      return;
    }

    this.setState({ isSubmitting: true, errorMessage: '', successMessage: '' });

    try {
      const res = await depositService.createCryptoDeposit(user.id, cryptoCurrency, cryptoNetwork, cryptoAmountFiat);
      if (res.success) {
        this.setState({
          cryptoPaymentResult: res,
          isSubmitting: false,
          successMessage: `Crypto deposit address generated for ${cryptoCurrency}!`,
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to generate crypto deposit address.';
      this.setState({ errorMessage: msg, isSubmitting: false });
    }
  }

  async handleSimulateDepositConfirmation(depositId) {
    this.setState({ isSubmitting: true });
    try {
      const res = await depositService.confirmDeposit(depositId);
      if (res.success) {
        this.setState({
          user: res.user,
          successMessage: res.message,
          momoPaymentResult: null,
          cryptoPaymentResult: null,
          isSubmitting: false,
        });

        // Trigger Jackpot Victory celebration immediately
        if (window.triggerJackpotCelebration) {
          window.triggerJackpotCelebration({
            type: 'deposit',
            amount: res.deposit?.amount || 0,
            newBalance: res.user?.balance,
            title: 'DEPOSIT CONFIRMED!',
            message: `GHS ${(res.deposit?.amount || 0).toFixed(2)} added directly to your spendable balance!`,
            currency: res.user?.currency || 'GHS',
          });
        }

        if (this.props.onRefreshUser) {
          this.props.onRefreshUser();
        }
      }
    } catch (err) {
      this.setState({ errorMessage: 'Error confirming deposit.', isSubmitting: false });
    }
  }

  render() {
    const { onNavigate } = this.props;
    const {
      user,
      activeTab,
      momoProvider,
      momoAmount,
      customMomoAmount,
      cryptoCurrency,
      cryptoNetwork,
      cryptoAmountFiat,
      cryptoInfo,
      momoPaymentResult,
      cryptoPaymentResult,
      isSubmitting,
      copiedField,
      successMessage,
      errorMessage,
    } = this.state;

    const presetAmounts = [100, 300, 700, 1500, 3000];

    return (
      <div id="recharge-page" className="space-y-5 pb-10">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-[#10253A] pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('home')}
              className="p-2 rounded-lg bg-[#10253A] text-[#94A3B8] hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Account Recharge</h2>
          </div>

          {user && (
            <div className="text-right">
              <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Current Balance</span>
              <p className="text-sm font-bold text-[#00D4A8]">{formatCurrency(user.balance, user.currency)}</p>
            </div>
          )}
        </div>

        {/* 24/7 Instant Service Banner */}
        <div className="p-3.5 bg-gradient-to-r from-[#00D4A8]/15 via-[#2DD4FF]/15 to-[#00D4A8]/15 border border-[#00D4A8]/40 rounded-2xl flex items-center gap-3 shadow-lg shadow-[#00D4A8]/5">
          <div className="w-9 h-9 rounded-xl bg-[#00D4A8]/20 border border-[#00D4A8]/50 flex items-center justify-center shrink-0 text-[#00D4A8]">
            <Zap className="w-5 h-5 fill-[#00D4A8]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-black text-white uppercase tracking-wider">⚡ 24/7 Instant Automatic Payment Gateway</p>
              <span className="px-2 py-0.5 rounded-full bg-[#00D4A8] text-[#07111F] text-[9px] font-black uppercase">ONLINE</span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5">
              All Mobile Money & Crypto deposits are processed instantly 24 hours a day, 7 days a week with zero delay!
            </p>
          </div>
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-[#00D4A8]/10 border border-[#00D4A8]/30 rounded-xl text-[#00D4A8] text-xs font-semibold flex items-center justify-between">
            <span>{successMessage}</span>
            <button onClick={() => this.setState({ successMessage: '' })}>✕</button>
          </div>
        )}

        {/* Main Tab Switcher */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#10253A] rounded-2xl border border-slate-800">
          <button
            onClick={() => this.setState({ activeTab: 'MOMO', momoPaymentResult: null })}
            className={`py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
              activeTab === 'MOMO'
                ? 'bg-[#00D4A8] text-[#07111F] shadow-lg shadow-[#00D4A8]/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>MOBILE MONEY</span>
          </button>

          <button
            onClick={() => this.setState({ activeTab: 'CRYPTO', cryptoPaymentResult: null })}
            className={`py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
              activeTab === 'CRYPTO'
                ? 'bg-[#00D4A8] text-[#07111F] shadow-lg shadow-[#00D4A8]/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>CRYPTO</span>
          </button>
        </div>

        {/* ================= TAB 1: MOBILE MONEY ================= */}
        {activeTab === 'MOMO' && (
          <div id="momo-tab-content" className="space-y-4">
            {!momoPaymentResult ? (
              <div className="bg-[#10253A] p-4 rounded-2xl border border-slate-800 space-y-4">
                {/* Provider Selection */}
                <div>
                  <label className="text-xs font-semibold text-[#94A3B8] uppercase block mb-2">
                    Select Provider
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Vodafone Cash', 'MTN MoMo', 'Telecel Cash'].map((provider) => (
                      <button
                        key={provider}
                        onClick={() => this.setState({ momoProvider: provider })}
                        className={`p-3 rounded-xl border text-center text-xs font-bold transition-all ${
                          momoProvider === provider
                            ? 'bg-[#00D4A8]/20 border-[#00D4A8] text-[#00D4A8]'
                            : 'bg-[#0D1B2A] border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {provider}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount Preset Cards */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-[#94A3B8] uppercase">
                      Select Amount (GHS)
                    </label>
                    <span className="text-[10px] font-bold text-[#00D4A8] bg-[#00D4A8]/10 px-2 py-0.5 rounded border border-[#00D4A8]/20">
                      Min: GHS 100
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                    {presetAmounts.map((amt) => (
                      <button
                        key={amt}
                        onClick={() => this.setState({ momoAmount: amt, customMomoAmount: '' })}
                        className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                          momoAmount === amt && !customMomoAmount
                            ? 'bg-gradient-to-r from-[#00D4A8] to-[#2DD4FF] text-[#07111F] border-[#00D4A8]'
                            : 'bg-[#0D1B2A] border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        GHS {amt}
                      </button>
                    ))}
                  </div>

                  <input
                    type="number"
                    min="100"
                    placeholder="Enter Custom Amount (Min GHS 100)"
                    value={customMomoAmount}
                    onChange={(e) => this.setState({ customMomoAmount: e.target.value })}
                    className="w-full bg-[#0D1B2A] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D4A8]"
                  />
                  <p className="text-[11px] text-[#2DD4FF] mt-2 font-medium">
                    💡 Minimum deposit is <strong>GHS 100</strong> (Welcome bonus: <strong>GHS 50</strong>). Referrer receives <strong>7% instant bonus</strong> on your first deposit!
                  </p>
                </div>

                {/* Submit button */}
                <button
                  onClick={() => this.handleCreateMomoDeposit()}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-[#00D4A8] to-[#2DD4FF] text-[#07111F] font-bold text-xs uppercase rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all"
                >
                  {isSubmitting ? 'Processing Request...' : 'CONTINUE TO PAYMENT INSTRUCTIONS'}
                </button>
              </div>
            ) : (
              /* Payment Instructions Card */
              <div className="bg-[#10253A] p-5 rounded-2xl border border-[#00D4A8]/40 space-y-4">
                <div className="text-center pb-3 border-b border-slate-800">
                  <span className="text-xs text-[#00D4A8] font-bold uppercase tracking-wider">Mobile Money Payment</span>
                  <h3 className="text-2xl font-black text-white mt-1">{momoPaymentResult.paymentDetails.merchantName || 'Vodafone Cash'}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Vodafone Cash / Mobile Money</p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="bg-[#0D1B2A] p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Amount to Pay</p>
                      <p className="font-bold text-white text-sm">GH₵ {momoPaymentResult.paymentDetails.amount.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="bg-[#0D1B2A] p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Number</p>
                      <p className="font-bold text-[#00D4A8] text-sm">{momoPaymentResult.paymentDetails.merchantNumber || '0202496815'}</p>
                    </div>
                    <button
                      onClick={() => this.handleCopy(momoPaymentResult.paymentDetails.merchantNumber || '0202496815', 'momoNumber')}
                      className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:text-white"
                    >
                      {copiedField === 'momoNumber' ? <Check className="w-4 h-4 text-[#00D4A8]" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="bg-[#0D1B2A] p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Name</p>
                      <p className="font-bold text-white text-sm">{momoPaymentResult.paymentDetails.accountName || 'Charles Asumah'}</p>
                    </div>
                  </div>

                  <div className="bg-[#0D1B2A] p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Wallet Type</p>
                      <p className="font-bold text-white text-sm">{momoPaymentResult.paymentDetails.walletType || 'Vodafone Cash'}</p>
                    </div>
                  </div>

                  <div className="bg-[#0D1B2A] p-3 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Transfer Note</p>
                    <p className="font-medium text-slate-200 text-xs leading-relaxed mt-1">
                      {momoPaymentResult.paymentDetails.instructions || 'Send your GHS payment via Vodafone Cash / Mobile Money and include the payment reference below for faster verification.'}
                    </p>
                    <p className="font-bold text-[#00D4A8] mt-2">+233 20 249 6815</p> 
                  </div>

                  <div className="bg-[#0D1B2A] p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Payment Reference</p>
                      <p className="font-bold text-amber-400 font-mono text-sm">{momoPaymentResult.paymentDetails.reference}</p>
                    </div>
                    <button
                      onClick={() => this.handleCopy(momoPaymentResult.paymentDetails.reference, 'momoRef')}
                      className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:text-white"
                    >
                      {copiedField === 'momoRef' ? <Check className="w-4 h-4 text-[#00D4A8]" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Instant 24/7 Automated Action button */}
                <div className="pt-2 space-y-2">
                  <div className="p-3 bg-[#00D4A8]/10 border border-[#00D4A8]/30 rounded-xl text-[#00D4A8] text-xs leading-relaxed flex items-start gap-2">
                    <Zap className="w-4 h-4 shrink-0 mt-0.5 fill-[#00D4A8]" />
                    <span>
                      <strong>⚡ 24/7 Instant Automatic Gateway:</strong> Once you complete your Mobile Money transfer, tap below to instantly verify payment and credit your account balance in real-time.
                    </span>
                  </div>

                  

                  <button
                    onClick={() => {
                      this.setState({
                        successMessage: `Deposit reference ${momoPaymentResult.paymentDetails.reference} submitted for Admin review. Your balance will also be credited upon admin review.`,
                        momoPaymentResult: null,
                      });
                      if (this.props.onRefreshUser) this.props.onRefreshUser();
                    }}
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-[#0D1B2A] border border-slate-700 text-slate-300 font-bold text-xs uppercase rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Submit Reference for Admin Review</span>
                  </button>

                  <button
                    onClick={() => this.setState({ momoPaymentResult: null })}
                    className="w-full py-2 text-slate-400 text-xs font-semibold hover:text-white"
                  >
                    Cancel / Back
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: CRYPTO ================= */}
        {activeTab === 'CRYPTO' && (
          <div id="crypto-tab-content" className="space-y-4">
            {/* Currency Selector */}
            <div className="bg-[#10253A] p-4 rounded-2xl border border-slate-800 space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#94A3B8] uppercase block mb-2">
                  Select Cryptocurrency (BTC / ETH / USDT)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { symbol: 'BTC', label: 'Bitcoin (BTC)', defaultNet: 'Bitcoin' },
                    { symbol: 'ETH', label: 'Ethereum (ETH)', defaultNet: 'ERC-20' },
                    { symbol: 'USDT', label: 'Tether (USDT)', defaultNet: 'TRC-20' },
                  ].map((item) => (
                    <button
                      key={item.symbol}
                      onClick={() =>
                        this.setState({
                          cryptoCurrency: item.symbol,
                          cryptoNetwork: item.defaultNet,
                          cryptoPaymentResult: null,
                        })
                      }
                      className={`p-3 rounded-xl border text-center transition-all ${
                        cryptoCurrency === item.symbol
                          ? 'bg-[#00D4A8]/20 border-[#00D4A8] text-[#00D4A8]'
                          : 'bg-[#0D1B2A] border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="block text-sm font-extrabold">{item.symbol}</span>
                      <span className="block text-[10px] text-slate-400 font-medium mt-0.5">
                        {item.symbol === 'BTC' ? 'Bitcoin' : item.symbol === 'ETH' ? 'ERC-20' : 'TRC / ERC'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Network Selector */}
              {cryptoCurrency === 'USDT' ? (
                <div>
                  <label className="text-xs font-semibold text-[#94A3B8] uppercase block mb-2">
                    Select USDT Network
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['TRC-20', 'ERC-20', 'BEP-20'].map((net) => (
                      <button
                        key={net}
                        onClick={() => this.setState({ cryptoNetwork: net, cryptoPaymentResult: null })}
                        className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                          cryptoNetwork === net
                            ? 'bg-[#2DD4FF]/20 border-[#2DD4FF] text-[#2DD4FF]'
                            : 'bg-[#0D1B2A] border-slate-800 text-slate-400'
                        }`}
                      >
                        {net}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-[#0D1B2A] rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Selected Blockchain Network</span>
                  <span className="text-xs font-bold text-[#2DD4FF] px-2.5 py-1 bg-[#2DD4FF]/10 rounded-lg border border-[#2DD4FF]/30">
                    {cryptoCurrency === 'BTC' ? 'Bitcoin (BTC Mainnet)' : 'Ethereum (ERC-20 Mainnet)'}
                  </span>
                </div>
              )}

              {/* Amount Fiat */}
              <div>
                <label className="text-xs font-semibold text-[#94A3B8] uppercase block mb-2">
                  Deposit Equivalent Amount (GHS)
                </label>
                <input
                  type="number"
                  value={cryptoAmountFiat}
                  onChange={(e) => this.setState({ cryptoAmountFiat: Number(e.target.value), cryptoPaymentResult: null })}
                  className="w-full bg-[#0D1B2A] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D4A8]"
                />
              </div>

              {/* Coin specific instruction note before generating */}
              <div className="p-3 bg-[#07111F] rounded-xl border border-slate-800 text-xs text-slate-400 leading-relaxed">
                {cryptoCurrency === 'BTC' && (
                  <p className="text-amber-300/90">
                    💡 <strong>BTC Deposit Note:</strong> Binance supports deposits from all BTC addresses (starting with &quot;1&quot;, &quot;3&quot;, &quot;bc1p&quot; and &quot;bc1q&quot;).
                  </p>
                )}
                {cryptoCurrency === 'ETH' && (
                  <p className="text-amber-300/90">
                    💡 <strong>ETH Deposit Note:</strong> Please do not send validator rewards to your Binance deposit address, as they will not be credited and funds may be lost.
                  </p>
                )}
                {cryptoCurrency === 'USDT' && (
                  <p className="text-amber-300/90">
                    💡 <strong>USDT Deposit Note:</strong> Deposits via smart contracts are not supported with the exception of ETH via ERC20, Arbitrum & Optimism network or BNB via BSC network.
                  </p>
                )}
              </div>

              {!cryptoPaymentResult && (
                <button
                  onClick={() => this.handleCreateCryptoDeposit()}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-[#00D4A8] to-[#2DD4FF] text-[#07111F] font-bold text-xs uppercase rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all"
                >
                  {isSubmitting ? 'Generating Address...' : `GENERATE ${cryptoCurrency} DEPOSIT ADDRESS & QR`}
                </button>
              )}
            </div>

            {/* Generated Crypto Deposit Display */}
            {cryptoPaymentResult && (() => {
              const depositAddr =
                cryptoPaymentResult.depositAddress ||
                cryptoPaymentResult.paymentDetails?.depositAddress ||
                cryptoPaymentResult.deposit?.address ||
                (cryptoCurrency === 'BTC'
                  ? '15512yaegwoVpZ2mjnsZ8mmVdhMnbcYybZ'
                  : cryptoCurrency === 'ETH'
                  ? '0x450306b9721d2cc03a70f3c6aa9b7a61b0137b44'
                  : cryptoNetwork === 'TRC-20'
                  ? 'TMmpdCUFH9xJ5efivRdyAw8MBVGqdsJmpX'
                  : '0x450306b9721d2cc03a70f3c6aa9b7a61b0137b44');

              return (
                <div className="bg-[#10253A] p-5 rounded-2xl border border-[#00D4A8]/40 space-y-4">
                  <div className="text-center pb-2 border-b border-slate-800">
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                      STATUS: WAITING FOR DEPOSIT
                    </span>
                    <h3 className="text-xl font-extrabold text-white mt-1">
                      {cryptoPaymentResult.paymentDetails?.cryptoAmount || cryptoPaymentResult.cryptoAmount} {cryptoCurrency}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Network: <span className="text-[#2DD4FF] font-bold">{cryptoNetwork}</span>
                    </p>
                  </div>

                  {/* QR Code */}
                  <div className="flex justify-center my-2">
                    <div className="p-3 bg-white rounded-2xl shadow-xl">
                      <QRCodeDisplay value={depositAddr} size={150} />
                    </div>
                  </div>

                  {/* Deposit Address Box */}
                  <div className="bg-[#0D1B2A] p-4 rounded-xl border border-slate-800 space-y-2">
                    <p className="text-xs text-slate-300 font-bold uppercase tracking-wider flex items-center justify-between">
                      <span>{cryptoCurrency} Deposit Address</span>
                      <span className="text-[#2DD4FF] text-[10px] font-mono">{cryptoNetwork}</span>
                    </p>
                    <div className="flex items-center justify-between gap-2 p-2.5 bg-[#07111F] rounded-lg border border-slate-800">
                      <p className="text-xs sm:text-sm font-mono text-[#00D4A8] font-bold break-all">
                        {depositAddr}
                      </p>
                      <button
                        onClick={() => this.handleCopy(depositAddr, 'cryptoAddr')}
                        className="p-2 rounded-lg bg-[#00D4A8]/20 text-[#00D4A8] hover:bg-[#00D4A8]/30 shrink-0 font-bold text-xs flex items-center gap-1"
                      >
                        {copiedField === 'cryptoAddr' ? (
                          <>
                            <Check className="w-4 h-4 text-[#00D4A8]" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Coin Specific Warning / Rules */}
                  {cryptoCurrency === 'BTC' && (
                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-xs leading-relaxed">
                      <strong>BTC Network Info:</strong> Binance supports deposits from all BTC addresses (starting with &quot;1&quot;, &quot;3&quot;, &quot;bc1p&quot; and &quot;bc1q&quot;).
                    </div>
                  )}

                  {cryptoCurrency === 'ETH' && (
                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-xs leading-relaxed">
                      <strong>ETH Warning:</strong> Please do not send validator rewards to your Binance deposit address, as they will not be credited and funds may be lost.
                    </div>
                  )}

                  {cryptoCurrency === 'USDT' && (
                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-xs leading-relaxed">
                      <strong>USDT Contract Rules:</strong> Deposits via smart contracts are not supported with the exception of ETH via ERC20, Arbitrum & Optimism network or BNB via BSC network.
                    </div>
                  )}

                  <div className="p-3 bg-[#00D4A8]/10 border border-[#00D4A8]/30 rounded-xl text-[#00D4A8] text-xs leading-relaxed flex items-start gap-2">
                    <Zap className="w-4 h-4 shrink-0 mt-0.5 fill-[#00D4A8]" />
                    <span>
                      <strong>⚡ 24/7 Automated Blockchain Scanner:</strong> Once your transfer is broadcast on the {cryptoNetwork} network, click below to automatically scan the blockchain and credit your account immediately.
                    </span>
                  </div>

                  {/* Instant Crypto Deposit Confirmation Button */}
                  <button
                    onClick={() => this.handleSimulateDepositConfirmation(cryptoPaymentResult.deposit?.id || cryptoPaymentResult.id)}
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-gradient-to-r from-[#00D4A8] via-[#2DD4FF] to-[#00D4A8] text-[#07111F] font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4 fill-[#07111F]" />
                    <span>INSTANT BLOCKCHAIN CONFIRM & CREDIT (24/7 AUTOMATED)</span>
                  </button>

                  <button
                    onClick={() => {
                      this.setState({
                        successMessage: `Crypto deposit request (${cryptoPaymentResult.paymentDetails?.cryptoAmount || cryptoPaymentResult.cryptoAmount || ''} ${cryptoCurrency}) submitted for Admin review. Balance will be updated upon verification.`,
                        cryptoPaymentResult: null,
                      });
                      if (this.props.onRefreshUser) this.props.onRefreshUser();
                    }}
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-[#0D1B2A] border border-slate-700 text-slate-300 font-bold text-xs uppercase rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Submit TxHash for Admin Review</span>
                  </button>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    );
  }
}

export default Recharge;
