export enum PaymentStatus {
  PENDING = "pending",
  PROCESSING = "processing", // payments only
  INCOMPLETE = "incomplete", // payments only
  CANCELED = "canceled", // payments only
  FAILED = "failed",
  REJECTED = "rejected",
  ABANDONED = "abandoned", // payments only
  EXPIRED = "expired",
  COMPLETE = "complete",
  REFUNDED = "refunded", // payments only
  PARTIALLY_REFUNDED = "partialy-refunded", // payments only
  SENT = "sent", // transfers only
}

export enum TransactionType {
  PAY_IN = "pay_in",
  PAY_OUT = "pay_out",
}

export const isFinal = (status: PaymentStatus): boolean => {
  return [
    PaymentStatus.CANCELED,
    PaymentStatus.FAILED,
    PaymentStatus.REJECTED,
    PaymentStatus.ABANDONED,
    PaymentStatus.EXPIRED,
    PaymentStatus.REFUNDED,
    PaymentStatus.PARTIALLY_REFUNDED,
  ].includes(status);
};

export const isTransitional = (status: PaymentStatus): boolean => {
  return [
    PaymentStatus.SENT,
    PaymentStatus.PENDING,
    PaymentStatus.PROCESSING,
    PaymentStatus.INCOMPLETE,
  ].includes(status);
};

export const isMixed = (status: PaymentStatus): boolean => {
  return status === PaymentStatus.COMPLETE;
};
