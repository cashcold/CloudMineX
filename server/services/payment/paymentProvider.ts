export interface PaymentRequest {
  userId: string;
  amount: number;
  provider: string;
  currency: string;
  network?: string;
  reference?: string;
}

export interface PaymentResponse {
  success: boolean;
  reference: string;
  provider: string;
  amount: number;
  cryptoAmount?: number;
  depositAddress?: string;
  merchantNumber?: string;
  merchantName?: string;
  accountName?: string;
  walletType?: string;
  instructions?: string;
  status: 'pending' | 'detected' | 'confirming' | 'confirmed' | 'failed';
  message: string;
  isDemo: boolean;
}

export interface IPaymentProvider {
  createDeposit(req: PaymentRequest): Promise<PaymentResponse>;
  checkStatus(reference: string): Promise<PaymentResponse>;
}
