import React, { Component } from 'react';
import { Users, Copy, Check, Gift, ArrowLeft, Share2, Sparkles } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { userService, referralService } from '../services/api';

export class Team extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: null,
      teamData: null,
      copied: false,
      isLoading: true,
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
      }
      if (currentUser) {
        const teamRes = await referralService.getReferralData(currentUser.id);
        this.setState({
          user: currentUser,
          teamData: teamRes,
          isLoading: false,
        });
      }
    } catch (err) {
      console.error('Error loading team data:', err);
      this.setState({ isLoading: false });
    }
  }

  handleCopyLink() {
    const { teamData } = this.state;
    const refCode = teamData ? teamData.referralCode : 'CMX-7892';
    const link = `${window.location.origin}/?ref=${refCode}`;
    navigator.clipboard.writeText(link);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  }

  render() {
    const { onNavigate } = this.props;
    const { teamData, copied, isLoading } = this.state;

    const refCode = teamData ? teamData.referralCode : 'CMX-7892';
    const refLink = `${window.location.origin}/?ref=${refCode}`;

    return (
      <div id="team-page" className="space-y-5 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#10253A] pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('home')}
              className="p-2 rounded-lg bg-[#10253A] text-[#94A3B8] hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Users className="w-4 h-4 text-[#00D4A8]" />
              <span>Team & Referral Network</span>
            </h2>
          </div>

          <button
            onClick={() => onNavigate('share')}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#00D4A8] to-[#2DD4FF] text-[#07111F] font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 hover:brightness-110 transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Invite Now</span>
          </button>
        </div>

        {/* Referral Link Banner */}
        <div className="bg-[#10253A] p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#94A3B8] font-semibold uppercase">My Referral Code</span>
            <span className="text-xs font-mono font-bold text-[#00D4A8] bg-[#00D4A8]/10 px-2.5 py-0.5 rounded-full border border-[#00D4A8]/30">
              {refCode}
            </span>
          </div>

          <div className="flex items-center justify-between bg-[#0D1B2A] p-2.5 rounded-xl border border-slate-800 gap-2">
            <input
              type="text"
              readOnly
              value={refLink}
              className="bg-transparent text-xs text-slate-300 w-full focus:outline-none font-mono truncate"
            />
            <button
              onClick={() => this.handleCopyLink()}
              className="py-1.5 px-3 bg-[#00D4A8] text-[#07111F] font-bold text-xs rounded-lg hover:brightness-110 shrink-0 flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          <div className="bg-[#10253A] p-3 rounded-2xl border border-slate-800">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Invited</p>
            <p className="text-lg font-extrabold text-white mt-0.5">{teamData ? teamData.totalInvited : 0}</p>
          </div>

          <div className="bg-[#10253A] p-3 rounded-2xl border border-slate-800">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Funded (1st Deposit)</p>
            <p className="text-lg font-extrabold text-[#00D4A8] mt-0.5">{teamData ? (teamData.fundedReferralsCount || 0) : 0}</p>
          </div>

          <div className="bg-[#10253A] p-3 rounded-2xl border border-slate-800">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">VIP Tier</p>
            <p className="text-xs font-extrabold text-[#2DD4FF] mt-1.5 uppercase truncate">
              {teamData ? (teamData.vipTier || 'Bronze VIP') : 'Bronze VIP'}
            </p>
          </div>

          <div className="bg-[#10253A] p-3 rounded-2xl border border-slate-800">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Referral Rewards</p>
            <p className="text-xs font-extrabold text-[#00D4A8] mt-1.5 truncate">
              {formatCurrency(teamData ? teamData.simulatedReferralRewards : 0, 'GHS')}
            </p>
          </div>
        </div>

        {/* VIP Progress Banner */}
        {teamData && teamData.nextTierRequirement && (
          <div className="p-3 bg-[#2DD4FF]/10 border border-[#2DD4FF]/30 rounded-xl text-[#2DD4FF] text-xs font-bold flex items-center justify-between">
            <span>🏆 VIP Progress: {teamData.nextTierRequirement}</span>
            <span className="text-[10px] uppercase bg-[#2DD4FF]/20 px-2 py-0.5 rounded text-white font-black">
              {teamData.vipTier || 'Bronze VIP'}
            </span>
          </div>
        )}

        {/* Team Members List */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Team Members ({teamData ? teamData.teamMembers.length : 0})</span>
          </h3>

          {!teamData || teamData.teamMembers.length === 0 ? (
            <div className="p-6 bg-[#10253A] rounded-2xl border border-slate-800 text-center">
              <p className="text-xs text-slate-400">No team members invited yet. Share your code to earn 7% deposit commission on their first deposit!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {teamData.teamMembers.map((m) => (
                <div key={m.id} className="bg-[#10253A] p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#00D4A8]/20 border border-[#00D4A8]/40 flex items-center justify-center font-bold text-xs text-[#00D4A8]">
                      {(m.referredUsername || 'M').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{m.referredUsername || 'Miner Member'}</p>
                      <p className="text-[10px] text-slate-400">{formatDate(m.createdAt)}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-bold text-[#00D4A8]">+{formatCurrency(m.reward || 0, 'GHS')}</p>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                      m.isFunded || m.status === 'funded'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-700/50 text-slate-400'
                    }`}>
                      {m.isFunded || m.status === 'funded' ? 'Funded Deposit' : 'Registered'}
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

export default Team;
