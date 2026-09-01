import React, { Component } from 'react';
import { Send, MessageSquare, ShieldCheck, ArrowLeft, CheckCircle2, Zap } from 'lucide-react';
import { chatService, userService } from '../services/api';
import { getUniqueDynamicName } from '../data/usernamesPool';

const cleanName = (raw) => {
  if (!raw) return 'User';
  return raw.trim().split(' ')[0].split('_')[0];
};

export class CommunityChat extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: null,
      messages: [],
      inputText: '',
      isSubmitting: false,
      filter: 'all', // all, payouts, deposits
    };
    this.pollTimer = null;
    this.simulationTimer = null;
  }

  componentDidMount() {
    this.loadData();
    this.pollTimer = setInterval(() => this.fetchMessages(), 6000);
    this.simulationTimer = setInterval(() => this.injectRandomClaim(), 7000);
  }

  componentWillUnmount() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.simulationTimer) clearInterval(this.simulationTimer);
  }

  async loadData() {
    try {
      let currentUser = this.props.user;
      if (!currentUser) {
        const userRes = await userService.getDemoUser();
        currentUser = userRes.user;
      }
      this.setState({ user: currentUser });
      this.fetchMessages();
    } catch (err) {
      console.error('Error loading chat user:', err);
    }
  }

  async fetchMessages() {
    try {
      const res = await chatService.getMessages();
      if (res.success && res.messages) {
        this.setState({ messages: res.messages });
      }
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    }
  }

  injectRandomClaim() {
    const randomUsername = getUniqueDynamicName();
    const momoAmounts = [180, 260, 350, 420, 560, 680, 750, 890, 1150, 1420, 1850, 2400];
    const usdtAmounts = [30, 50, 75, 100, 150, 200, 300, 500];
    const momoAmt = momoAmounts[Math.floor(Math.random() * momoAmounts.length)];
    const usdtAmt = usdtAmounts[Math.floor(Math.random() * usdtAmounts.length)];

    const messageTemplates = [
      { text: `MoMo payout of GHS ${momoAmt}.00 confirmed instantly! CloudMineX is fast 🔥`, badge: 'Verified Payout', type: 'payout' },
      { text: `Recharged GHS ${momoAmt}.00 via MoMo and activated my cloud hash rig! 🚀`, badge: 'Active Miner', type: 'deposit' },
      { text: `Just received GHS ${momoAmt}.00 daily yield payout directly to wallet!`, badge: 'Verified Payout', type: 'payout' },
      { text: `Deposited ${usdtAmt} USDT (TRC-20) and credited in 1 block confirmation! Very fast`, badge: 'Crypto Miner', type: 'deposit' },
      { text: `Withdrew GHS ${momoAmt}.00 to my MTN MoMo wallet! Thanks admin!`, badge: 'Verified Payout', type: 'payout' },
      { text: `Withdrew ${usdtAmt} USDT to Binance successfully! Instant transaction.`, badge: 'Verified Payout', type: 'payout' },
      { text: `GHS ${momoAmt}.00 withdrawal alert just hit my phone! 100% real 🔥`, badge: 'Verified Payout', type: 'payout' },
      { text: `Recharged GHS ${momoAmt}.00! Daily yield starts ticking right away`, badge: 'Pro Miner', type: 'deposit' },
    ];

    const randomTemplate = messageTemplates[Math.floor(Math.random() * messageTemplates.length)];
    const newMsg = {
      id: `chat_sim_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      username: randomUsername,
      text: randomTemplate.text,
      badge: randomTemplate.badge,
      type: randomTemplate.type,
      createdAt: new Date().toISOString(),
    };

    this.setState((prevState) => ({
      messages: [newMsg, ...prevState.messages].slice(0, 100),
    }));
  }

  async handleSendMessage(e) {
    if (e) e.preventDefault();
    const { user, inputText, isSubmitting } = this.state;
    if (!inputText.trim() || isSubmitting) return;

    this.setState({ isSubmitting: true });

    try {
      const res = await chatService.sendMessage(user ? user.id : null, inputText.trim());
      if (res.success) {
        this.setState({ inputText: '', isSubmitting: false });
        this.fetchMessages();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      this.setState({ isSubmitting: false });
    }
  }

  render() {
    const { onNavigate } = this.props;
    const { user, messages, inputText, isSubmitting, filter } = this.state;

    const filteredMessages = messages.filter((m) => {
      if (filter === 'payouts') return m.type === 'payout' || m.text.toLowerCase().includes('payout') || m.text.toLowerCase().includes('received');
      if (filter === 'deposits') return m.type === 'deposit' || m.text.toLowerCase().includes('recharge') || m.text.toLowerCase().includes('deposit');
      return true;
    });

    return (
      <div id="community-chat-page" className="space-y-4 pb-12">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#10253A] pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('home')}
              className="p-2 rounded-lg bg-[#10253A] text-[#94A3B8] hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-[#00D4A8]" />
                <span>Community Payout Claims</span>
              </h2>
              <p className="text-[10px] text-slate-400">Live community proofs, deposit logs & chat room</p>
            </div>
          </div>

          <span className="text-[10px] font-bold text-[#00D4A8] bg-[#00D4A8]/10 px-2.5 py-1 rounded-full border border-[#00D4A8]/30 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#00D4A8] animate-pulse"></span>
            Live Chat Active
          </span>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-2">
          {[
            { id: 'all', label: 'All Chat Claims' },
            { id: 'payouts', label: 'Payout Proofs 💸' },
            { id: 'deposits', label: 'Recharges ⚡' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => this.setState({ filter: f.id })}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === f.id
                  ? 'bg-[#00D4A8] text-[#07111F]'
                  : 'bg-[#10253A] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Chat Feed */}
        <div className="bg-[#10253A] p-3.5 rounded-2xl border border-slate-800 space-y-3 min-h-[380px] max-h-[500px] overflow-y-auto scrollbar-thin">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No chat messages found under this filter.
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isCurrentUser = user && user.username === msg.username;

              return (
                <div
                  key={msg.id}
                  className={`p-3 rounded-xl border transition-all ${
                    isCurrentUser
                      ? 'bg-[#00D4A8]/10 border-[#00D4A8]/30 ml-4'
                      : 'bg-[#0D1B2A] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* NO PICTURE - Usernames only as requested */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5">
                      {/* Text Username only - clean single name */}
                      <span className="font-extrabold text-white text-xs">@{cleanName(msg.username)}</span>

                      {msg.badge && (
                        <span className="text-[9px] font-bold px-2 py-0.2 rounded-md bg-[#00D4A8]/20 text-[#00D4A8] border border-[#00D4A8]/30 uppercase">
                          {msg.badge}
                        </span>
                      )}
                    </div>

                    <span className="text-[9px] text-slate-500 font-mono">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    {msg.text}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Message Input Box */}
        <form onSubmit={(e) => this.handleSendMessage(e)} className="flex items-center gap-2">
          <input
            type="text"
            placeholder={user ? `Post a payout claim or comment as @${cleanName(user.username)}...` : 'Write a message...'}
            value={inputText}
            onChange={(e) => this.setState({ inputText: e.target.value })}
            className="flex-1 bg-[#10253A] border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00D4A8]"
          />
          <button
            type="submit"
            disabled={isSubmitting || !inputText.trim()}
            className="px-4 py-3 bg-gradient-to-r from-[#00D4A8] to-[#2DD4FF] text-[#07111F] font-black text-xs rounded-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1 shrink-0 uppercase"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Post Claim</span>
          </button>
        </form>
      </div>
    );
  }
}

export default CommunityChat;
