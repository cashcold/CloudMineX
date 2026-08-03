import { IPaymentProvider, PaymentRequest, PaymentResponse } from './paymentProvider';
import { db } from '../../config/dbStore';
import { convertFiatToCrypto } from '../cryptoPriceService';

export class CryptoProvider implements IPaymentProvider {
  async createDeposit(req: PaymentRequest): Promise<PaymentResponse> {
    const reference = req.reference || `CRYPTO-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const currency = (req.currency || 'USDT').toUpperCase() as 'BTC' | 'ETH' | 'USDT';
    const network = req.network || (currency === 'USDT' ? 'TRC-20' : currency === 'BTC' ? 'Bitcoin' : 'Ethereum Mainnet');

    let depositAddress = db.settings.usdtTrc20Address;
    if (currency === 'BTC') {
      depositAddress = db.settings.btcAddress;
    } else if (currency === 'ETH') {
      depositAddress = db.settings.ethAddress;
    } else if (currency === 'USDT') {
      if (network === 'ERC-20') depositAddress = db.settings.usdtErc20Address;
      else if (network === 'BEP-20') depositAddress = db.settings.usdtBep20Address;
      else depositAddress = db.settings.usdtTrc20Address;
    }

    const { cryptoAmount } = convertFiatToCrypto(req.amount, currency);

    return {
      success: true,
      reference,
      provider: `Crypto (${currency} ${network})`,
      amount: req.amount,
      cryptoAmount,
      depositAddress,
      status: 'pending',
      message: `Deposit address generated for ${currency} on ${network} network.`,
      isDemo: true,
    };
  }

  async checkStatus(reference: string): Promise<PaymentResponse> {
    const deposit = db.deposits.find((d) => d.reference === reference);
    if (!deposit) {
      return {
        success: false,
        reference,
        provider: 'Crypto',
        amount: 0,
        status: 'failed',
        message: 'Deposit reference not found',
        isDemo: true,
      };
    }

    return {
      success: true,
      reference: deposit.reference,
      provider: deposit.provider,
      amount: deposit.amount,
      cryptoAmount: deposit.cryptoAmount,
      depositAddress: deposit.address,
      status: deposit.status as any,
      message: `Crypto deposit status: ${deposit.status}`,
      isDemo: true,
    };
  }
}

export const cryptoProvider = new CryptoProvider();
