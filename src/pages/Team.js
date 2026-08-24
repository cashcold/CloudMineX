import React, { Component } from 'react';
import {
  Users,
  Copy,
  Check,
  Gift,
  ArrowLeft,
  Share2,
  Sparkles,
  Lock,
  Unlock,
  Award,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  Zap,
} from 'lucide-react';
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
      claimingId: null,
      claimSuccessMsg: '',
      claimErrorMsg: '',
      activeMemberTab: 'all', // 'all', 'funded', 'pending'
      selectedRoadmapIndex: 0,
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

  async handleClaimMilestone(milestoneId) {
    const { user } = this.state;
    if (!user || this.state.claimingId) return;

    this.setState({ claimingId: milestoneId, claimSuccessMsg: '', claimErrorMsg: '' });

    try {
      const res = await referralService.claimMilestone(user.id, milestoneId);
      if (res.success) {
        this.setState({
          claimSuccessMsg: res.message || 'Milestone reward claimed successfully!',
          claimingId: null,
        });

        // Reload referral data and parent user balance
        await this.loadData();
        if (this.props.onRefreshUser) {
          this.props.onRefreshUser();
        }

        setTimeout(() => {
          this.setState({ claimSuccessMsg: '' });
        }, 6000);
      } else {
        this.setState({
          claimErrorMsg: res.message || 'Failed to claim milestone',
          claimingId: null,
        });
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to claim milestone reward';
      this.setState({
        claimErrorMsg: errMsg,
        claimingId: null,
      });
    }
  }

  render() {
    const { onNavigate } = this.props;
    const {
      teamData,
      copied,
      isLoading,
      claimingId,
      claimSuccessMsg,
      claimErrorMsg,
      activeMemberTab,
      selectedRoadmapIndex,
    } = this.state;

    const refCode = teamData ? teamData.referralCode : 'CMX-7892';
    const refLink = `${window.location.origin}/?ref=${refCode}`;
    const fundedCount = teamData ? (teamData.fundedReferralsCount || 0) : 0;
    const totalInvited = teamData ? (teamData.totalInvited || 0) : 0;
    const unlockedCount = teamData ? (teamData.unlockedCount || 0) : 0;
    const currentLevelTitle = teamData ? (teamData.currentLevelTitle || 'Starter Level') : 'Starter Level';

    // Fallback default milestones if server is starting
    const milestones = (teamData && teamData.milestones) ? teamData.milestones : [
      {
        id: 'bronze',
        level: 1,
        name: 'BRONZE',
        title: 'Bronze Affiliate',
        requiredRefs: 1,
        perk: '10% First Deposit Comm',
        rewardText: '$10 Cash Bonus',
        rewardUsd: 10,
        rewardGhs: 150,
        isUnlocked: fundedCount >= 1,
        isClaimed: false,
        canClaim: fundedCount >= 1,
        color: '#D97706',
      },
      {
        id: 'silver',
        level: 2,
        name: 'SILVER',
        title: 'Silver Ambassador',
        requiredRefs: 5,
        perk: 'Priority Support & Fast Withdrawals',
        rewardText: '$50 Instant Bonus + 1% Extra Comm',
        rewardUsd: 50,
        rewardGhs: 750,
        isUnlocked: fundedCount >= 5,
        isClaimed: false,
        canClaim: fundedCount >= 5,
        color: '#94A3B8',
      },
      {
        id: 'gold',
        level: 3,
        name: 'GOLD',
        title: 'Gold Partner',
        requiredRefs: 12,
        perk: 'Custom Referral Link & Manager',
        rewardText: '$250 VIP Partner Reward',
        rewardUsd: 250,
        rewardGhs: 3750,
        isUnlocked: fundedCount >= 12,
        isClaimed: false,
        canClaim: fundedCount >= 12,
        color: '#EAB308',
      },
      {
        id: 'platinum',
        level: 4,
        name: 'PLATINUM',
        title: 'Platinum Director',
        requiredRefs: 25,
        perk: '0% Withdrawal Fees & Exclusive Webinars',
        rewardText: '$1,000 Executive Cash Pool',
        rewardUsd: 1000,
        rewardGhs: 15000,
        isUnlocked: fundedCount >= 25,
        isClaimed: false,
        canClaim: fundedCount >= 25,
        color: '#2DD4FF',
      },
      {
        id: 'diamond',
        level: 5,
        name: 'DIAMOND',
        title: 'Diamond Legend',
        requiredRefs: 50,
        perk: 'VIP Regional Ambassador Status',
        rewardText: '$3,000 Global Profit Share',
        rewardUsd: 3000,
        rewardGhs: 45000,
        isUnlocked: fundedCount >= 50,
        isClaimed: false,
        canClaim: fundedCount >= 50,
        color: '#A855F7',
      },
    ];

    const teamMembers = teamData ? (teamData.teamMembers || []) : [];
    const filteredMembers = teamMembers.filter((m) => {
      if (activeMemberTab === 'funded') return m.isFunded || m.status === 'funded';
      if (activeMemberTab === 'pending') return !m.isFunded && m.status !== 'funded';
      return true;
    });

    const fundedMembersCount = teamMembers.filter((m) => m.isFunded || m.status === 'funded').length;
    const pendingMembersCount = teamMembers.length - fundedMembersCount;

    return (
      <div id="team-page" className="space-y-4 pb-12">
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
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#00D4A8] to-[#2DD4FF] text-[#07111F] font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all shadow-md"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Invite Now</span>
          </button>
        </div>

        {/* Claim Notification Alerts */}
        {claimSuccessMsg && (
          <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl flex items-center gap-3 text-emerald-300 text-xs font-semibold animate-pulse shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{claimSuccessMsg}</span>
          </div>
        )}

        {claimErrorMsg && (
          <div className="p-3.5 bg-rose-500/15 border border-rose-500/40 rounded-2xl flex items-center gap-3 text-rose-300 text-xs font-semibold shadow-lg">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{claimErrorMsg}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TOP MILESTONE ROADMAP (MATCHING SCREENSHOT) */}
        {/* ========================================================================= */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 px-1">
            <Award className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
              MILESTONE ROADMAP{' '}
              <span className="text-[#00D4A8] font-normal lowercase">
                ({currentLevelTitle} - {unlockedCount} / 5 Unlocked)
              </span>
            </h3>
          </div>

          {/* Horizontal Roadmap Chips / Cards */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {milestones.map((m, idx) => {
              const isCurrent = idx === selectedRoadmapIndex;
              return (
                <button
                  key={m.id}
                  onClick={() => this.setState({ selectedRoadmapIndex: idx })}
                  className={`relative p-2 sm:p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-between min-h-[78px] sm:min-h-[88px] ${
                    m.isUnlocked
                      ? 'bg-[#10253A] border-amber-500/60 shadow-md shadow-amber-500/10'
                      : 'bg-[#0D1B2A]/90 border-slate-800 opacity-70'
                  } ${isCurrent ? 'ring-2 ring-amber-400/80 scale-[1.02]' : 'hover:border-slate-700'}`}
                >
                  {/* Top Lock/Unlock Status Icon */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${
                      m.isUnlocked
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {m.isUnlocked ? <Unlock className="w-3 h-3 text-amber-300" /> : <Lock className="w-3 h-3" />}
                  </div>

                  {/* Tier Title */}
                  <span
                    className={`text-[10px] sm:text-xs font-black uppercase tracking-tight block ${
                      m.isUnlocked ? 'text-amber-300' : 'text-slate-400'
                    }`}
                  >
                    {m.name}
                  </span>

                  {/* Ref Req */}
                  <span className="text-[9px] text-slate-400 font-medium mt-0.5">
                    {m.requiredRefs} Ref{m.requiredRefs > 1 ? 's' : ''}
                  </span>

                  {/* Bottom Indicator Dot if Claimed */}
                  {m.isClaimed && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#07111F] flex items-center justify-center">
                      <Check className="w-2 h-2 text-white font-bold" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ALL AFFILIATE MILESTONE REWARD TIERS (MATCHING SCREENSHOT TIERS 1-5) */}
        {/* ========================================================================= */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2 px-1">
            <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400/20" />
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-400">
              ALL AFFILIATE MILESTONE REWARD TIERS
            </h3>
          </div>

          <div className="space-y-2.5">
            {milestones.map((m) => {
              const isEligible = fundedCount >= m.requiredRefs;
              const isClaimed = m.isClaimed;
              const isClaiming = claimingId === m.id;

              return (
                <div
                  key={m.id}
                  className={`bg-[#10253A] p-4 rounded-2xl border transition-all ${
                    isEligible
                      ? 'border-amber-500/40 bg-gradient-to-b from-[#10253A] to-[#0D1B2A]'
                      : 'border-slate-800'
                  }`}
                >
                  {/* Card Header: Badge + Title + Subtitle */}
                  <div className="flex items-start gap-3">
                    {/* Number Badge (1, 2, 3, 4, 5) */}
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 border"
                      style={{
                        backgroundColor: `${m.color}25`,
                        borderColor: `${m.color}60`,
                        color: m.color,
                      }}
                    >
                      {m.level}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-extrabold text-amber-300">
                          {m.title}{' '}
                          <span className="text-slate-400 font-medium text-xs">
                            ({m.requiredRefs} Referral{m.requiredRefs > 1 ? 's' : ''})
                          </span>
                        </h4>

                        {/* Funded Status Tag */}
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            isEligible
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {fundedCount} / {m.requiredRefs} Funded
                        </span>
                      </div>

                      {/* Perk description */}
                      <p className="text-xs text-slate-300 font-medium mt-0.5">{m.perk}</p>
                    </div>
                  </div>

                  {/* Reward Button / Claim Box */}
                  <div className="mt-3">
                    {isClaimed ? (
                      <div className="w-full py-2.5 px-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-emerald-300 text-xs font-bold">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>{m.rewardText} Claimed</span>
                        </span>
                        <span className="text-[10px] text-emerald-400/80 uppercase font-mono">Added to Balance</span>
                      </div>
                    ) : isEligible ? (
                      <button
                        onClick={() => this.handleClaimMilestone(m.id)}
                        disabled={isClaiming}
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-[#00D4A8] via-[#2DD4FF] to-[#00D4A8] text-[#07111F] font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 animate-pulse"
                      >
                        <Gift className="w-4 h-4 fill-[#07111F]" />
                        <span>
                          {isClaiming
                            ? 'Crediting to Balance...'
                            : `🎁 CLAIM ${m.rewardText.toUpperCase()} (GHS ${m.rewardGhs.toLocaleString()})`}
                        </span>
                      </button>
                    ) : (
                      <div className="w-full py-2.5 px-3 bg-[#07111F]/80 border border-emerald-500/20 rounded-xl flex items-center justify-between text-emerald-400 text-xs font-bold">
                        <span className="flex items-center gap-1.5">
                          <Gift className="w-4 h-4 text-emerald-400" />
                          <span>{m.rewardText}</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Need {Math.max(0, m.requiredRefs - fundedCount)} more funded ref
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STRICT QUALITY & DEPOSIT POLICY NOTICE */}
        {/* ========================================================================= */}
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-200/90 leading-relaxed flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-300 block mb-0.5">⚡ Strict Deposit & Referral Rule:</strong>
            Only invited members who complete their <strong>1st confirmed deposit</strong> count as valid referrals
            for Milestone Progress and trigger the <strong>10% instant commission</strong>. Unfunded registrations
            remain in pending status and do not unlock rewards until their first recharge.
          </div>
        </div>

        {/* ========================================================================= */}
        {/* REFERRAL LINK BANNER */}
        {/* ========================================================================= */}
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
              className="py-1.5 px-3 bg-[#00D4A8] text-[#07111F] font-bold text-xs rounded-lg hover:brightness-110 active:scale-95 shrink-0 flex items-center gap-1 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STATS OVERVIEW GRID */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          <div className="bg-[#10253A] p-3 rounded-2xl border border-slate-800">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Invited</p>
            <p className="text-lg font-extrabold text-white mt-0.5">{totalInvited}</p>
          </div>

          <div className="bg-[#10253A] p-3 rounded-2xl border border-slate-800">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Funded (1st Deposit)</p>
            <p className="text-lg font-extrabold text-[#00D4A8] mt-0.5">{fundedCount}</p>
          </div>

          <div className="bg-[#10253A] p-3 rounded-2xl border border-slate-800">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">VIP Milestone</p>
            <p className="text-xs font-extrabold text-[#2DD4FF] mt-1.5 uppercase truncate">
              {currentLevelTitle}
            </p>
          </div>

          <div className="bg-[#10253A] p-3 rounded-2xl border border-slate-800">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Referral Earnings</p>
            <p className="text-xs font-extrabold text-[#00D4A8] mt-1.5 truncate">
              {formatCurrency(teamData ? teamData.referralRewards : 0, 'GHS')}
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TEAM MEMBERS LIST WITH FILTER TABS */}
        {/* ========================================================================= */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-[#00D4A8]" />
              <span>Team Members ({teamMembers.length})</span>
            </h3>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-[#0D1B2A] p-1 rounded-xl border border-slate-800 text-[10px] font-bold">
              <button
                onClick={() => this.setState({ activeMemberTab: 'all' })}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeMemberTab === 'all'
                    ? 'bg-[#00D4A8] text-[#07111F]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({teamMembers.length})
              </button>
              <button
                onClick={() => this.setState({ activeMemberTab: 'funded' })}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeMemberTab === 'funded'
                    ? 'bg-emerald-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Funded ({fundedMembersCount})
              </button>
              <button
                onClick={() => this.setState({ activeMemberTab: 'pending' })}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeMemberTab === 'pending'
                    ? 'bg-amber-500 text-[#07111F]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Pending ({pendingMembersCount})
              </button>
            </div>
          </div>

          {filteredMembers.length === 0 ? (
            <div className="p-6 bg-[#10253A] rounded-2xl border border-slate-800 text-center space-y-1">
              <p className="text-xs font-bold text-slate-300">
                {activeMemberTab === 'funded'
                  ? 'No funded referrals yet.'
                  : activeMemberTab === 'pending'
                  ? 'No pending un-deposited referrals.'
                  : 'No team members registered yet.'}
              </p>
              <p className="text-[11px] text-slate-400">
                Share your link to invite members and earn 10% first deposit commission plus Milestone cash bonuses!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMembers.map((m) => {
                const isFunded = m.isFunded || m.status === 'funded';
                return (
                  <div
                    key={m.id}
                    className="bg-[#10253A] p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          isFunded
                            ? 'bg-[#00D4A8]/20 border border-[#00D4A8]/40 text-[#00D4A8]'
                            : 'bg-slate-800 border border-slate-700 text-slate-400'
                        }`}
                      >
                        {(m.referredUsername || 'M').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{m.referredUsername || 'Miner Member'}</p>
                        <p className="text-[10px] text-slate-400">{formatDate(m.createdAt)}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {isFunded ? (
                        <>
                          <p className="text-xs font-bold text-[#00D4A8]">+{formatCurrency(m.reward || 0, 'GHS')}</p>
                          <span className="text-[9px] px-2 py-0.5 rounded font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            1st Deposit Confirmed
                          </span>
                        </>
                      ) : (
                        <>
                          <p className="text-[10px] font-bold text-slate-400">GHS 0.00</p>
                          <span className="text-[9px] px-2 py-0.5 rounded font-bold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            Pending Deposit
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default Team;
