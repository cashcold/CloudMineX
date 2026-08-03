# CloudMineX - Digital Mining Dashboard & MERN Platform

CloudMineX is a production-quality, mobile-first cloud mining dashboard and financial platform. Users can explore simulated mining plans, start digital mining contracts, track estimated rewards, perform Mobile Money and Cryptocurrency recharges, view income logs, request demo withdrawals, share referral links, and manage their profile and team.

---

## Features

- **Mobile-First Financial UI**: Glassmorphism cards, dark luxury theme (`#07111F`), smooth navigation transitions, and sticky mobile bottom navigation.
- **Simulated Mining Plans**:
  - STARTER MINER (GHS 100, 7 Days, 5% daily yield)
  - BASIC MINER (GHS 300, 14 Days, 6% daily yield)
  - PRO MINER (GHS 700, 30 Days, 7% daily yield)
  - ADVANCED MINER (GHS 1,500, 60 Days, 8% daily yield)
  - PREMIUM MINER (GHS 3,000, 90 Days, 9% daily yield)
- **Recharge System**:
  - **Mobile Money**: MTN MoMo, Telecel Cash, AT Money with generated payment references and merchant instructions.
  - **Cryptocurrency**: BTC, ETH, USDT with network selection (ERC-20, TRC-20, BEP-20), QR Code rendering, and address copying.
- **Reward Engine**: Server-side yield calculation engine for simulated rewards.
- **Income & Transaction Ledger**: Full transaction log for deposits, withdrawals, contract purchases, and daily simulated yields.
- **Team & Referral Network**: Dedicated referral code generator, copyable links, QR codes, and direct social sharing (WhatsApp, Telegram, Twitter).
- **Admin & Demo Management**: Comprehensive admin dashboard for plan management, user stats monitoring, deposit/withdrawal logs, and payment configurations.
- **Demo Mode**: Clear banners ensuring users know all payments and mining rewards are simulated.

---

## Tech Stack

- **Frontend**: React (Class Components in `.js` files), Tailwind CSS v4, Lucide React, Axios, QRCode.
- **Backend**: Node.js, Express.js, TypeScript, Payment Provider Abstraction, Reward Engine.
- **Database**: Extensible JSON File Store / MongoDB Mongoose interface with seeded defaults.

---

## Installation & Running

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Start Development Server
```bash
npm run dev
```

The application runs on `http://localhost:3000`.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## API Documentation

- `GET /api/users/demo` - Returns active demo user account details
- `GET /api/mining-plans` - Returns all active mining plans
- `POST /api/mining/start` - Starts a mining contract (validates backend balance)
- `POST /api/mining/tick-rewards` - Simulates a daily yield payout tick
- `POST /api/deposits/mobile-money` - Initiates Mobile Money recharge request
- `POST /api/deposits/crypto` - Generates crypto deposit address & QR code
- `POST /api/deposits/:id/confirm-demo` - Simulates payment confirmation in demo mode
- `POST /api/withdrawals/demo` - Submits a demo withdrawal request
- `GET /api/income/:userId` - Returns income overview and transaction ledger
- `GET /api/referrals/:userId` - Returns user team referral stats
- `GET /api/admin/stats` - Returns admin platform analytics
- `POST /api/admin/plans` - Creates new mining plan
- `POST /api/admin/reset-demo` - Resets demo environment to initial seed state

---

## License

Apache-2.0 License. Fictional brand CloudMineX for demonstration purposes.
