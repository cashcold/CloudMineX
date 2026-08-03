import { IPaymentProvider, PaymentRequest, PaymentResponse } from './paymentProvider';
import { db } from '../../config/dbStore';

export class MobileMoneyProvider implements IPaymentProvider {
  async createDeposit(req: PaymentRequest): Promise<PaymentResponse> {
    const reference = req.reference || `MOMO-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const providerLower = req.provider.toLowerCase();

    let merchantName = db.settings.mtnMerchantName;
    let merchantNumber = db.settings.mtnMerchantNumber;

    if (providerLower.includes('telecel')) {
      merchantName = db.settings.telecelMerchantName;
      merchantNumber = db.settings.telecelMerchantNumber;
    } else if (providerLower.includes('at')) {
      merchantName = db.settings.atMerchantName;
      merchantNumber = db.settings.atMerchantNumber;
    }

    return {
      success: true,
      reference,
      provider: req.provider,
      amount: req.amount,
      merchantName,
      merchantNumber,
      status: 'pending',
      message: 'Mobile Money payment instructions generated. Perform transfer using reference.',
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
