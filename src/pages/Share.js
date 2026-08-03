import React, { Component } from 'react';
import { Share2, Copy, Check, ArrowLeft, Send, Twitter, MessageSquare, QrCode } from 'lucide-react';
import QRCodeDisplay from '../components/QRCodeDisplay';
import { userService, referralService } from '../services/api';

export class Share extends Component {
  constructor(props) {
    super(props);
    this.state = {
      teamData: null,
      copied: false,
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
        this.setState({ teamData: teamRes });
      }
    } catch (err) {
      console.error('Error loading share page data:', err);
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

  shareSocial(platform) {
    const { teamData } = this.state;
    const refCode = teamData ? teamData.referralCode : 'CMX-7892';
    const link = `${window.location.origin}/?ref=${refCode}`;
    const text = encodeURIComponent(`Join CloudMineX Digital Mining Dashboard! Start digital cloud mining contracts with my referral code: ${refCode}`);

    let url = '';
    if (platform === 'whatsapp') url = `https://api.whatsapp.com/send?text=${text}%20${encodeURIComponent(link)}`;
    else if (platform === 'telegram') url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${text}`;
    else if (platform === 'twitter') url = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(link)}`;

    window.open(url, '_blank');
  }

  render() {
    const { onNavigate } = this.props;
    const { teamData, copied } = this.state;

    const refCode = teamData ? teamData.referralCode : 'CMX-7892';
    const refLink = `${window.location.origin}/?ref=${refCode}`;

    return (
      <div id="share-page" className="space-y-5 pb-10">
        {/* Top Bar */}
        <div className="flex items-center justify-between border-b border-[#10253A] pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('home')}
              className="p-2 rounded-lg bg-[#10253A] text-[#94A3B8] hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#00D4A8]" />
              <span>Share & Invite Referral</span>
            </h2>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="bg-[#10253A] p-6 rounded-2xl border border-slate-800 text-center space-y-4">
          <h3 className="text-base font-extrabold text-white">Your CloudMineX Invite QR</h3>
          <p className="text-xs text-[#94A3B8]">Scan to join CloudMineX mining network</p>

          <div className="flex justify-center my-2">
            <QRCodeDisplay value={refLink} size={180} />
          </div>

          <div className="inline-block px-3 py-1 bg-[#00D4A8]/10 rounded-full border border-[#00D4A8]/30 font-mono text-xs font-bold text-[#00D4A8]">
            Code: {refCode}
          </div>
        </div>

        {/* Copy Referral Link */}
        <div className="bg-[#10253A] p-4 rounded-2xl border border-slate-800 space-y-2">
          <label className="text-xs font-semibold text-[#94A3B8] uppercase block">
            Referral Link
          </label>
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

        {/* Social Share Buttons */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Direct Social Share</h3>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => this.shareSocial('whatsapp')}
              className="p-3 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs flex flex-col items-center gap-1.5 hover:bg-emerald-600/30 transition-all"
            >
              <MessageSquare className="w-5 h-5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={() => this.shareSocial('telegram')}
              className="p-3 rounded-xl bg-sky-600/20 border border-sky-500/40 text-sky-400 font-bold text-xs flex flex-col items-center gap-1.5 hover:bg-sky-600/30 transition-all"
            >
              <Send className="w-5 h-5" />
              <span>Telegram</span>
            </button>

            <button
              onClick={() => this.shareSocial('twitter')}
              className="p-3 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 font-bold text-xs flex flex-col items-center gap-1.5 hover:bg-blue-600/30 transition-all"
            >
              <Twitter className="w-5 h-5" />
              <span>Twitter</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default Share;
