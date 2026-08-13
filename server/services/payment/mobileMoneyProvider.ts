import { IPaymentProvider, PaymentRequest, PaymentResponse } from './paymentProvider';
import { db } from '../../config/dbStore';

export class MobileMoneyProvider implements IPaymentProvider {
  async createDeposit(req: PaymentRequest): Promise<PaymentResponse> {
    const reference = req.reference || `MOMO-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const providerLower = req.provider.toLowerCase();

    let merchantName = 'Vodafone Cash';
    let merchantNumber = '0202496815';
    let accountName = 'Charles Asumah';
    let walletType = 'Vodafone Cash';
    let instructions = 'Send your GHS payment via Vodafone Cash / Mobile Money and include the payment reference below for faster verification.';

    if (providerLower.includes('telecel')) {
      merchantName = db.settings.telecelMerchantName;
      merchantNumber = db.settings.telecelMerchantNumber;
      accountName = 'CloudMineX Telecel Cash';
      walletType = 'Telecel Cash';
      instructions = 'Send your GHS payment via Telecel Cash and include the payment reference below for faster verification.';
    } else if (providerLower.includes('at')) {
      merchantName = db.settings.atMerchantName;
      merchantNumber = db.settings.atMerchantNumber;
      accountName = 'CloudMineX AT Money';
      walletType = 'AT Money';
      instructions = 'Send your GHS payment via AT Money and include the payment reference below for faster verification.';
    } else if (providerLower.includes('mtn')) {
      merchantName = db.settings.mtnMerchantName;
      merchantNumber = db.settings.mtnMerchantNumber;
      accountName = 'CloudMineX Ghana MoMo';
      walletType = 'MTN MoMo';
      instructions = 'Send your GHS payment via MTN MoMo and include the payment reference below for faster verification.';
    }

    return {
      success: true,
      reference,
      provider: req.provider,
      amount: req.amount,
      merchantName,
      merchantNumber,
      accountName,
      walletType,
      instructions,
      status: 'pending',
      message: instructions,
      isDemo: true,
    };
  }

  async checkStatus(reference: string): Promise<PaymentResponse> {
    const deposit = db.deposits.find((d) => d.reference === reference);
    if (!deposit) {
      return {
        success: false,
        reference,
        provider: 'Mobile Money',
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
      status: deposit.status as any,
      message: `Payment status: ${deposit.status}`,
      isDemo: true,
    };
  }
}

export const mobileMoneyProvider = new MobileMoneyProvider();
