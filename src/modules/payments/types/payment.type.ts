import { PaymentStatus } from "src/helpers/payment-status";

export interface Customer {
  email: string;
  name?: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
}

export interface InitializePayment {
  amount: number;
  currency: string;
  reference: string;
  description?: string;
  customer: Customer;
  callback?: string;
  metadata?: Record<string, string>;
}

export interface ResponseMetadata {
  status: string;
  message: string;
  code: number;
  errors?: Record<string, string[]>;
}

export interface PaymentTransaction
  extends Omit<InitializePayment, "customer"> {
  amount_total: number;
  sandbox: boolean;
  fee: number;
  converted_amount: number;
  customer: string;
  reference: string;
  merchant_reference: string;
  status: PaymentStatus;
  geo: string;
  created_at: string;
  updated_at: string;
}

export interface InitializePaymentResponse extends ResponseMetadata {
  transaction: PaymentTransaction;
  authorization_url?: string;
}

export interface ChargePaymentResponse extends ResponseMetadata {
  action: string;
}

export interface VerifyPaymentResponse extends ResponseMetadata {
  payment: PaymentTransaction;
}
