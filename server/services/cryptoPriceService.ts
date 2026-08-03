// Crypto Price Service for GHS <-> Crypto conversions

export interface CryptoRates {
  BTC: number; // Price of 1 BTC in GHS
  ETH: number; // Price of 1 ETH in GHS
  USDT: number; // Price of 1 USDT in GHS
  GHS_USD: number; // 1 USD in GHS
}

// Current market benchmark rates (configurable or dynamic)
const CURRENT_RATES: CryptoRates = {
  BTC: 1425000.0, // 1 BTC ~ GHS 1,425,000
  ETH: 51200.00,  // 1 ETH ~ GHS 51,200
  USDT: 15.50,    // 1 USDT ~ GHS 15.50
  GHS_USD: 15.50,
};

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
