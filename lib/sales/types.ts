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
  coldCount?: number;
  roomCount?: number;
  carrierCount?: number;
  baseAmount?: number;
  baseCount?: number;
  addAmount?: number;
  addCount?: number;
  paymentAmount?: number;
  cancelAmount?: number;
  netAmount?: number;
};

export type DailySalesApiItem = {
  id: number;
  price: number;
  storageId?: number | null;
  mberNo?: number | null;
  payType: string | number;
  type: string | number;
  createdAt: string;
  ordId?: string | null;
  tossPaymentKey?: string | null;
  couponCodeId?: number | null;
  couponPrice?: number | null;
  point?: string | null;
  memo?: string | null;
};

export type DailySalesApiResponse = {
  date: string;
  coldCount: number;
  roomCount: number;
  carrierCount: number;
  baseAmount: number;
  baseCount: number;
  addAmount: number;
  addCount: number;
  cancelAmount: number;
  paymentAmount: number;
  netAmount: number;
  items: DailySalesApiItem[];
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
  payTypeCode: string;
  payTypeLabel: string;
  rowTypeCode: string;
  rowTypeLabel: string;
  point: string;
  pointLabel: string;
  memo: string;
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
  coldCount?: number;
  roomCount?: number;
  carrierCount?: number;
  baseAmount?: number;
  baseCount?: number;
  addAmount?: number;
  addCount?: number;
};

export type DailySummary = {
  paymentAmount: number;
  refundAmount: number;
  paymentCount: number;
  refundCount: number;
  avgPaymentAmount: number;
  coldCount?: number;
  roomCount?: number;
  carrierCount?: number;
  baseAmount?: number;
  baseCount?: number;
  addAmount?: number;
  addCount?: number;
  netAmount?: number;
};

export type SalesDashboardData = {
  monthRows: MonthlyChartRow[];
  paymentRows: PaymentChartRow[];
  dailyRows: DailySalesViewRow[];
  monthSummary: MonthSummary;
  dailySummary: DailySummary;
};

export type ManualSalesRequest = {
  price: number;
  payType: 1 | 2;
  point: PointKey;
  memo: string;
};

export type ManualSalesResponse = {
  ok: boolean;
  message: string;
  item?: DailySalesApiItem;
};

export type ManualSalesViewRow = {
  id: number;
  createdAt: string;
  createdAtLabel: string;
  price: number;
  priceLabel: string;
  payTypeCode: string;
  payTypeLabel: string;
  point: string;
  pointLabel: string;
  memo: string;
};

export type ManualSalesDashboardData = {
  manualRows: ManualSalesViewRow[];
};