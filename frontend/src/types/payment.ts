export interface Payment {
  id: number;
  appointmentId: number;
  patientId: number;
  patientName: string;
  doctorName: string;
  amount: number;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  transactionId: string;
  paymentReference?: string;
  cardLastFour?: string;
  cardType?: string;
  description?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
}

export interface PaymentRequest {
  appointmentId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  cardNumber: string;
  cardHolderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  description?: string;
}

export interface PaymentResponse {
  paymentId: number;
  transactionId: string;
  status: PaymentStatus;
  message: string;
  processedAt: string;
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  NET_BANKING = 'NET_BANKING',
  UPI = 'UPI',
  WALLET = 'WALLET',
  CASH = 'CASH'
}