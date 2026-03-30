import { formatPrice } from "@/lib/common";
import type {
  DailySalesApiItem,
  DailySalesApiResponse,
  DailySalesViewRow,
  DailySummary,
  MonthSalesApiItem,
  MonthSummary,
  MonthlyChartRow,
  PaymentChartRow,
  PointKey,
  SalesDashboardData,
} from "./types";

export const POINT_LABEL: Record<PointKey, string> = {
  sungsim: "으능정이점",
  baseball: "야구장점",
  bank: "은행점",
};

const PAYMENT_TYPE_LABEL: Record<string, string> = {
  "0": "앱",
  "1": "카드",
  "2": "현금",
  additionalProp1: "앱",
  additionalProp2: "카드",
  additionalProp3: "현금",
};

const ROW_TYPE_LABEL: Record<string, string> = {
  "0": "기본결제",
  "1": "추가결제",
  "2": "취소",
};

function extractCode(raw?: string | number | null) {
  if (raw === null || raw === undefined) return "";

  const text = String(raw).trim();
  if (!text) return "";

  if (/^\d+$/.test(text)) return text;

  const leading = text.match(/^(\d+)\s*=/);
  if (leading) return leading[1];

  const anyNumber = text.match(/\d+/);
  return anyNumber?.[0] ?? "";
}

function parseFlexibleDate(value?: string | null) {
  if (!value) return null;

  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;

  const commaNumbers = String(value)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => Number(part));

  if (
    commaNumbers.length >= 6 &&
    commaNumbers.slice(0, 6).every((v) => Number.isFinite(v))
  ) {
    const [year, month, day, hour, minute, second] = commaNumbers;
    return new Date(year, month - 1, day, hour, minute, second);
  }

  const digits = String(value).replace(/[^\d]/g, "");
  if (digits.length >= 14) {
    const year = Number(digits.slice(0, 4));
    const month = Number(digits.slice(4, 6));
    const day = Number(digits.slice(6, 8));
    const hour = Number(digits.slice(8, 10));
    const minute = Number(digits.slice(10, 12));
    const second = Number(digits.slice(12, 14));
    return new Date(year, month - 1, day, hour, minute, second);
  }

  return null;
}

function formatDateLabel(value?: string | null) {
  const date = parseFlexibleDate(value);
  if (!date) return value || "-";

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}

function formatDateTimeLabel(value?: string | null) {
  const date = parseFlexibleDate(value);
  if (!date) return value || "-";

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
}

function sumRecordValues(record?: Record<string, number>) {
  return Object.values(record ?? {}).reduce(
    (acc, cur) => acc + Number(cur || 0),
    0,
  );
}

export function getPaymentTypeLabel(raw?: string | number | null) {
  const code = extractCode(raw);
  return PAYMENT_TYPE_LABEL[code] ?? "-";
}

export function getRowTypeLabel(raw?: string | number | null) {
  const code = extractCode(raw);
  return ROW_TYPE_LABEL[code] ?? "-";
}

export function getPointLabel(point?: string | null) {
  if (!point) return "-";
  if (point === "sungsim") return POINT_LABEL.sungsim;
  if (point === "baseball") return POINT_LABEL.baseball;
  if (point === "bank") return POINT_LABEL.bank;
  return point;
}

export function mapMonthRows(rows: MonthSalesApiItem[]): MonthlyChartRow[] {
  return [...rows]
    .map((row) => {
      const paymentAmount = Number(row.paymentAmount ?? sumRecordValues(row.paymentTypeAmount));
      const cancelAmount = Number(row.cancelAmount ?? sumRecordValues(row.paymentTypeCancelAmount));

      return {
        date: row.createdAt,
        label: formatDateLabel(row.createdAt),
        totalAmount: Number(row.netAmount ?? paymentAmount - cancelAmount),
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function mapPaymentRows(rows: MonthSalesApiItem[]): PaymentChartRow[] {
  const amountMap: Record<string, number> = {};
  const countMap: Record<string, number> = {};
  const cancelAmountMap: Record<string, number> = {};
  const cancelCountMap: Record<string, number> = {};

  rows.forEach((row) => {
    Object.entries(row.paymentTypeAmount ?? {}).forEach(([key, value]) => {
      amountMap[key] = (amountMap[key] ?? 0) + Number(value || 0);
    });

    Object.entries(row.paymentTypeCount ?? {}).forEach(([key, value]) => {
      countMap[key] = (countMap[key] ?? 0) + Number(value || 0);
    });

    Object.entries(row.paymentTypeCancelAmount ?? {}).forEach(([key, value]) => {
      cancelAmountMap[key] = (cancelAmountMap[key] ?? 0) + Number(value || 0);
    });

    Object.entries(row.paymentTypeCancelCount ?? {}).forEach(([key, value]) => {
      cancelCountMap[key] = (cancelCountMap[key] ?? 0) + Number(value || 0);
    });
  });

  const keys = Array.from(
    new Set([
      ...Object.keys(amountMap),
      ...Object.keys(countMap),
      ...Object.keys(cancelAmountMap),
      ...Object.keys(cancelCountMap),
    ]),
  );

  return keys.map((key) => ({
    key,
    label: PAYMENT_TYPE_LABEL[key] ?? key,
    amount: amountMap[key] ?? 0,
    count: countMap[key] ?? 0,
    cancelAmount: cancelAmountMap[key] ?? 0,
    cancelCount: cancelCountMap[key] ?? 0,
  }));
}

export function mapDailyRows(rows: DailySalesApiItem[]): DailySalesViewRow[] {
  return [...rows]
    .map((row) => {
      const payTypeCode = extractCode(row.payType);
      const rowTypeCode = extractCode(row.type);

      return {
        id: row.id,
        createdAt: row.createdAt,
        createdAtLabel: formatDateTimeLabel(row.createdAt),
        price: Number(row.price || 0),
        priceLabel: formatPrice(Number(row.price || 0)),
        payTypeCode,
        payTypeLabel: getPaymentTypeLabel(row.payType),
        rowTypeCode,
        rowTypeLabel: getRowTypeLabel(row.type),
        point: row.point || "-",
        pointLabel: getPointLabel(row.point),
        memo: row.memo?.trim() || "-",
      };
    })
    .sort((a, b) => {
      const aDate = parseFlexibleDate(a.createdAt)?.getTime() ?? 0;
      const bDate = parseFlexibleDate(b.createdAt)?.getTime() ?? 0;
      return bDate - aDate;
    });
}

export function buildMonthSummary(
  monthRows: MonthSalesApiItem[],
  paymentRows: PaymentChartRow[],
): MonthSummary {
  const totalPaymentAmount = monthRows.reduce(
    (acc, cur) => acc + Number(cur.paymentAmount || 0),
    0,
  );

  const totalCancelAmount = monthRows.reduce(
    (acc, cur) => acc + Number(cur.cancelAmount || 0),
    0,
  );

  const totalPaymentCount = paymentRows.reduce(
    (acc, cur) => acc + Number(cur.count || 0),
    0,
  );

  const totalCancelCount = paymentRows.reduce(
    (acc, cur) => acc + Number(cur.cancelCount || 0),
    0,
  );

  const appRow =
    paymentRows.find((row) => row.key === "0" || row.label === "앱") ?? null;

  const cardRow =
    paymentRows.find((row) => row.key === "1" || row.label === "카드") ?? null;

  const coldCount = monthRows.reduce(
    (acc, cur) => acc + Number(cur.coldCount || 0),
    0,
  );

  const roomCount = monthRows.reduce(
    (acc, cur) => acc + Number(cur.roomCount || 0),
    0,
  );

  const carrierCount = monthRows.reduce(
    (acc, cur) => acc + Number(cur.carrierCount || 0),
    0,
  );

  const baseAmount = monthRows.reduce(
    (acc, cur) => acc + Number(cur.baseAmount || 0),
    0,
  );

  const baseCount = monthRows.reduce(
    (acc, cur) => acc + Number(cur.baseCount || 0),
    0,
  );

  const addAmount = monthRows.reduce(
    (acc, cur) => acc + Number(cur.addAmount || 0),
    0,
  );

  const addCount = monthRows.reduce(
    (acc, cur) => acc + Number(cur.addCount || 0),
    0,
  );

  const totalAmount = monthRows.reduce(
    (acc, cur) => acc + Number(cur.netAmount || 0),
    0,
  );

  return {
    totalAmount,
    totalPaymentAmount,
    totalCancelAmount,
    totalPaymentCount,
    totalCancelCount,
    appPaymentAmount: Number(appRow?.amount || 0),
    cardPaymentAmount: Number(cardRow?.amount || 0),
    appCancelAmount: Number(appRow?.cancelAmount || 0),
    cardCancelAmount: Number(cardRow?.cancelAmount || 0),
    coldCount,
    roomCount,
    carrierCount,
    baseAmount,
    baseCount,
    addAmount,
    addCount,
  };
}

export function buildDailySummary(daily: DailySalesApiResponse): DailySummary {
  const paymentCount = daily.items.filter((row) => {
    const type = extractCode(row.type);
    return type === "0" || type === "1";
  }).length;

  const refundCount = daily.items.filter(
    (row) => extractCode(row.type) === "2",
  ).length;

  const avgPaymentAmount =
    paymentCount > 0
      ? Math.round(Number(daily.paymentAmount || 0) / paymentCount)
      : 0;

  return {
    paymentAmount: Number(daily.paymentAmount || 0),
    refundAmount: Number(daily.cancelAmount || 0),
    paymentCount,
    refundCount,
    avgPaymentAmount,
    coldCount: Number(daily.coldCount || 0),
    roomCount: Number(daily.roomCount || 0),
    carrierCount: Number(daily.carrierCount || 0),
    baseAmount: Number(daily.baseAmount || 0),
    baseCount: Number(daily.baseCount || 0),
    addAmount: Number(daily.addAmount || 0),
    addCount: Number(daily.addCount || 0),
    netAmount: Number(daily.netAmount || 0),
  };
}

export function mapSalesDashboardData(
  monthItems: MonthSalesApiItem[],
  dailyData: DailySalesApiResponse,
): SalesDashboardData {
  const paymentRows = mapPaymentRows(monthItems);

  return {
    monthRows: mapMonthRows(monthItems),
    paymentRows,
    dailyRows: mapDailyRows(dailyData.items ?? []),
    monthSummary: buildMonthSummary(monthItems, paymentRows),
    dailySummary: buildDailySummary(dailyData),
  };
}