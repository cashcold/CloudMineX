// Crypto Price Service for GHS <-> Crypto conversions

export interface CryptoRates {
  BTC: number; // Price of 1 BTC in GHS
  ETH: number; // Price of 1 ETH in GHS
  USDT: number; // Price of 1 USDT in GHS
  GHS_USD: number; // 1 USD in GHS
}

export interface MarketTicker {
  symbol: string;
  name: string;
  price: number;
  change: string;
  high: number;
  low: number;
  volume: string;
}

// Current market benchmark rates (configurable or dynamic)
const CURRENT_RATES: CryptoRates = {
  BTC: 1425000.0, // 1 BTC ~ GHS 1,425,000
  ETH: 51200.00,  // 1 ETH ~ GHS 51,200
  USDT: 15.50,    // 1 USDT ~ GHS 15.50
  GHS_USD: 15.50,
};

let cachedTickers: MarketTicker[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 91420.5, change: '+2.85%', high: 92100.0, low: 88900.0, volume: '34.2B' },
  { symbol: 'ETH', name: 'Ethereum', price: 3410.2, change: '+1.42%', high: 3490.0, low: 3340.0, volume: '18.7B' },
  { symbol: 'USDT', name: 'Tether USD', price: 1.0, change: '+0.01%', high: 1.001, low: 0.999, volume: '58.4B' },
  { symbol: 'SOL', name: 'Solana', price: 184.6, change: '+4.12%', high: 189.5, low: 176.2, volume: '8.9B' },
  { symbol: 'BNB', name: 'BNB Chain', price: 592.1, change: '-0.38%', high: 601.0, low: 588.0, volume: '3.1B' },
  { symbol: 'XRP', name: 'Ripple', price: 0.584, change: '+0.95%', high: 0.598, low: 0.575, volume: '2.4B' },
];
let lastTickerUpdate = 0;

export function getMarketTickers(): MarketTicker[] {
  const now = Date.now();
  // Jitter slightly every 3 seconds for active telemetry feel
  if (now - lastTickerUpdate > 3000) {
    lastTickerUpdate = now;
    cachedTickers = cachedTickers.map((t) => {
      const deltaPercent = (Math.random() - 0.49) * 0.004; // ±0.2%
      const newPrice = +(t.price * (1 + deltaPercent)).toFixed(t.price < 2 ? 4 : 2);
      const isUp = deltaPercent >= 0;
      return {
        ...t,
        price: newPrice,
        change: `${isUp ? '+' : ''}${(deltaPercent * 100).toFixed(2)}%`,
        high: Math.max(t.high, newPrice),
        low: Math.min(t.low, newPrice),
      };
    });
  }
  return cachedTickers;
}

export function getCryptoRates(): CryptoRates {
  return CURRENT_RATES;
}

export function convertFiatToCrypto(fiatAmountGHS: number, currency: 'BTC' | 'ETH' | 'USDT'): { cryptoAmount: number; rate: number } {
  const rates = getCryptoRates();
  const rate = rates[currency] || 15.50;
  let cryptoAmount = fiatAmountGHS / rate;

  if (currency === 'BTC') {
    cryptoAmount = Number(cryptoAmount.toFixed(8));
  } else if (currency === 'ETH') {
    cryptoAmount = Number(cryptoAmount.toFixed(6));
  } else {
    cryptoAmount = Number(cryptoAmount.toFixed(2));
  }

  return { cryptoAmount, rate };
}

export function convertCryptoToFiat(cryptoAmount: number, currency: 'BTC' | 'ETH' | 'USDT'): number {
  const rates = getCryptoRates();
  const rate = rates[currency] || 15.50;
  return Number((cryptoAmount * rate).toFixed(2));
}
