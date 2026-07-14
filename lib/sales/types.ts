export type PointKey = "sungsim" | "baseball" | "bank";
export type SalesPeriodType = "month" | "daily";
export type SalesMonthView = "calendar" | "settlement";
export type SalesPaymentFilter = "all" | "app" | "card";

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
  photoCardAmount?: number;
  photoCardCount?: number;
  prepaidThisMonthAmount?: number;
  prepaidNextMonthAmount?: number;
};

export type SalesPrepaidSummary = {
  baseDate: string;
  point: PointKey;
  thisMonthStartDate: string;
  thisMonthEndDate: string;
  nextMonthStartDate: string;
  nextMonthEndDate: string;
  prepaidThisMonthAmount: number;
  prepaidNextMonthAmount: number;
};

export type DailySalesApiItem = {
  id: number;
  price: number;
  storageId?: number | null;
  mberNo?: number | null;
  mberNm?: string | null;
  tel?: string | null;
  payType: string | number;
  type: string | number;
  createdAt: string | number[];
  ordId?: string | null;
  tossPaymentKey?: string | null;
  couponCodeId?: number | null;
  couponPrice?: number | null;
  point?: string | null;
  memo?: string | null;
};

export type DailySalesDetailItem = {
  item: DailySalesApiItem;
  payerName?: string | null;
  payerTel?: string | null;
  cardCompany?: string | null;
};

export type SalesCarryoverSummary = {
  year: number;
  month: number;
  point: PointKey;
  amount: number;
  count: number | null;
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
  detailItems?: DailySalesDetailItem[];
};

export type PhotoCardSalesMonthDailyItem = {
  date: string;
  totalAmount?: number;
  cardAmount?: number;
  count?: number;
};

export type PhotoCardSalesMonthResponse = {
  year: number;
  month: number;
  totalAmount?: number;
  cardAmount?: number;
  appAmount?: number;
  cashAmount?: number;
  count?: number;
  daily?: PhotoCardSalesMonthDailyItem[];
};

export type PhotoCardSalesPaymentItem = {
  id?: number | string | null;
  orderId?: string | null;
  paymentKey?: string | null;
  orderName?: string | null;
  amount?: number | string | null;
  status?: string | null;
  method?: string | null;
  receiptUrl?: string | null;
  approvedAt?: string | number[] | null;
  createDt?: string | number[] | null;
  updateDt?: string | number[] | null;
};

export type PhotoCardSalesDailyResponse = {
  date: string;
  totalAmount?: number;
  cardAmount?: number;
  appAmount?: number;
  cashAmount?: number;
  count?: number;
  items?: PhotoCardSalesPaymentItem[];
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
  reserveId: number | null;
  createdAt: string | number[];
  createdAtLabel: string;
  customerName: string;
  customerTel: string;
  price: number;
  priceLabel: string;
  payTypeCode: string;
  payTypeLabel: string;
  rowTypeCode: string;
  rowTypeLabel: string;
  point: string;
  pointLabel: string;
  memo: string;
  ordId: string;
  tossPaymentKey: string;
  memberNo: number | null;
  cardCompany: string;
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
  prepaidSummary: SalesPrepaidSummary | null;
  carryoverSummary: SalesCarryoverSummary | null;
  rawMonthItems: MonthSalesApiItem[];
  rawDailyData: DailySalesApiResponse;
};

export type ManualSalesRequest = {
  price: number;
  payType: 1 | 2;
  point: PointKey;
  salesDate?: string;
  memo: string;
};

export type ManualSalesResponse = {
  ok: boolean;
  message: string;
  item?: DailySalesApiItem;
};

export type ManualSalesViewRow = {
  id: number;
  reserveId: number | null;
  createdAt: string | number[];
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

export type SettlementDailyRow = {
  date: string;
  amount: number;
  count: number;
};

export type SettlementPickupDailyRow = SettlementDailyRow & {
  storageFee: number;
  coldCount: number;
  coldAmount: number;
  roomCount: number;
  roomAmount: number;
  carrierCount: number;
  carrierAmount: number;
};

export type SettlementPickupLedgerRow = {
  id: number;
  date: string;
  amount: number;
  type: "payment" | "cancel";
  reserveId: number;
};

export type SalesSettlementData = {
  year: number;
  month: number;
  bank: SettlementDailyRow[];
  baseball: SettlementDailyRow[];
  photoCard: SettlementDailyRow[];
  pickupDaily: SettlementPickupDailyRow[];
  pickupLedger: SettlementPickupLedgerRow[];
};
