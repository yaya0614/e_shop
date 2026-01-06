export interface PaymentCard {
  id: string;
  cardHolderName: string;
  binCode: string;
  lastFour: string;
  type: string;
  bankName: string;
  expiryMonth: number;
  expiryYear: number;
}

export interface GetPaymentsResponse {
  payments: PaymentCard[];
}

export interface BindCardRequest {
  cardNumber: string;
  cardHolderName: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
}

export interface DeletePaymentRequest {
  id: string;
}
