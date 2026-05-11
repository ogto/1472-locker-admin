export type PhotoCardPaymentStatus = "CANCELED" | "FAILED" | "PAID" | "PENDING";

export type PhotoCardPaymentOrder = {
  amount: number;
  customerKey: string;
  orderId: string;
  orderName: string;
  status: PhotoCardPaymentStatus;
};

export type TossWidgets = {
  renderAgreement: (params: { selector: string }) => Promise<unknown>;
  renderPaymentMethods: (params: { selector: string; variantKey?: string }) => Promise<unknown>;
  requestPayment: (params: {
    customerEmail?: string;
    customerMobilePhone?: string;
    customerName?: string;
    failUrl: string;
    orderId: string;
    orderName: string;
    successUrl: string;
  }) => Promise<void>;
  setAmount: (params: { currency: "KRW"; value: number }) => Promise<void>;
};

export type TossPaymentsFactory = (clientKey: string) => {
  widgets: (params: { customerKey: string }) => TossWidgets;
};

declare global {
  interface Window {
    TossPayments?: TossPaymentsFactory;
  }
}
