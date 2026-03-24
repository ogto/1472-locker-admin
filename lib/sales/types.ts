export type PointKey = "sungsim" | "baseball" | "bank";
export type SalesPeriodType = "month" | "daily";

export type MonthSalesApiItem = {
  createdAt: string;
  paymentTypeAmount?: Record<string, number>;
  paymentTypeCancelAmount?: Record<string, number>;
  paymentTypeCancelCount?: Record<string, number>;
  paymentTypeCount?: Record<string, number>;
  totalAmount: number;
  typeAmount?: Record<string, number>;
};

export type DailySalesApiItem = {
  id: number;
  price: number;
  storageId: number;
  mberNo: number;
  payType: string;
  type: string;
  createdAt: string;
  ordId?: string;
  tossPaymentKey?: string;
  couponCodeId?: number;
  couponPrice?: number;
  point?: string;
};

export type MonthlyChartRow = {
  date: string;
  label: string;
  totalAmount: number;
};

export type PaymentChartRow = {
  key: string;
  label: string;
  amount: number;
  count: number;
  cancelAmount: number;
  cancelCount: number;
};

export type DailySalesViewRow = {
  id: number;
  createdAt: string;
  createdAtLabel: string;
  price: number;
  priceLabel: string;
  storageId: number;
  payTypeCode: string;
  payTypeLabel: string;
  rowTypeCode: string;
  rowTypeLabel: string;
  ordId: string;
  point: string;
  pointLabel: string;
  couponPrice: number;
  couponPriceLabel: string;
};

export type MonthSummary = {
  totalAmount: number;

  totalPaymentAmount: number;
  totalCancelAmount: number;

  totalPaymentCount: number;
  totalCancelCount: number;

  appPaymentAmount: number;
  cardPaymentAmount: number;

  appCancelAmount: number;
  cardCancelAmount: number;
};

export type DailySummary = {
  paymentAmount: number;
  refundAmount: number;
  paymentCount: number;
  refundCount: number;
  avgPaymentAmount: number;
};

export type SalesDashboardData = {
  monthRows: MonthlyChartRow[];
  paymentRows: PaymentChartRow[];
  dailyRows: DailySalesViewRow[];
  monthSummary: MonthSummary;
  dailySummary: DailySummary;
};