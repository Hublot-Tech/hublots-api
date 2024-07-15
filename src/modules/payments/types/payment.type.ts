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

export interface CreateRecipient {
  email: string;
  channel?: "cm.mobile" | "cm.mtn" | "cm.orange";
  number: number;
  name: string;
  phone: string;
  country?: string;
}

export interface Recipient {
  id: string;
  email: string;
  channel: "cm.mobile" | "cm.mtn" | "cm.orange";
  number: number;
  name: string;
  phone: string;
  country: string;
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
  description: string;
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

export interface FetchTransactionResponse extends ResponseMetadata {
  transaction: PaymentTransaction;
}

export interface FetchRecipientResponse extends ResponseMetadata {
  items: Recipient[];
}

export interface CreateRecipientResponse extends ResponseMetadata {
  beneficiary: Recipient;
}

export interface InitiateTransfer {
  amount: number;
  currency: string;
  description: string;
  statement?: string;
  recipient: string;
}

export interface Transfer extends Omit<PaymentTransaction, "customer"> {
  beneficiary: string;
  statement: string;
  trxref: string;
}

export interface InitiateTransferResponse extends ResponseMetadata {
  transfer: Transfer;
}

export interface FetchTransferResponse extends ResponseMetadata {
  transfer: Transfer;
}
