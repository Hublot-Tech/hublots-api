export enum PaymentStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  INCOMPLETE = "incomplete",
  CANCELED = "canceled",
  FAILED = "failed",
  REJECTED = "rejected",
  ABANDONED = "abandoned",
  EXPIRED = "expired",
  COMPLETE = "complete",
  REFUNDED = "refunded",
  PARTIALLY_REFUNDED = "partialy-refunded",
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
    PaymentStatus.PENDING,
    PaymentStatus.PROCESSING,
    PaymentStatus.INCOMPLETE,
  ].includes(status);
};

export const isMixed = (status: PaymentStatus): boolean => {
  return status === PaymentStatus.COMPLETE;
};
