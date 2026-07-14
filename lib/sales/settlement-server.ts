import "server-only";
import type { SalesSettlementData } from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.trim().replace(/\/+$/, "") ||
  "https://cloud.1472.ai:18443/api";

type RawRecord = Record<string, unknown>;

function unwrap<T>(value: unknown): T {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as RawRecord;
    if ("data" in record) return record.data as T;
    if ("result" in record) return record.result as T;
    if ("payload" in record) return record.payload as T;
  }
  return value as T;
}

async function fetchJson(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, cache: "no-store" });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`upstream ${response.status} (${new URL(url).pathname}): ${text.slice(0, 200)}`);
  }
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`upstream returned non-JSON (${new URL(url).pathname}): ${text.slice(0, 120)}`);
  }
}

function dateKey(value: unknown) {
  if (Array.isArray(value) && value.length >= 3) {
    return `${value[0]}-${String(value[1]).padStart(2, "0")}-${String(value[2]).padStart(2, "0")}`;
  }
  return String(value ?? "").match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? "";
}

function sumRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return 0;
  return Object.values(value as RawRecord).reduce<number>((sum, item) => sum + Number(item || 0), 0);
}

function monthRows(value: unknown) {
  const rows = unwrap<RawRecord[]>(value);
  return (Array.isArray(rows) ? rows : [])
    .map((row) => {
      const payment = Number(row.paymentAmount ?? sumRecord(row.paymentTypeAmount));
      const cancel = Number(row.cancelAmount ?? sumRecord(row.paymentTypeCancelAmount));
      const paymentCount = sumRecord(row.paymentTypeCount);
      const cancelCount = sumRecord(row.paymentTypeCancelCount);
      const hasPaymentCounts =
        Object.keys((row.paymentTypeCount as RawRecord | undefined) ?? {}).length > 0 ||
        Object.keys((row.paymentTypeCancelCount as RawRecord | undefined) ?? {}).length > 0;
      return {
        date: dateKey(row.createdAt),
        amount: Number(row.netAmount ?? payment - cancel),
        count: hasPaymentCounts
          ? paymentCount - cancelCount
          : Number(row.baseCount || 0) + Number(row.addCount || 0),
      };
    })
    .filter((row) => row.date)
    .sort((a, b) => a.date.localeCompare(b.date));
}

type UsageRow = {
  id: number;
  reserveId: number;
  date: string;
  amount: number;
};

function isCanceledUsage(row: RawRecord) {
  const status = String(row.reservationStatus ?? "").toUpperCase();
  return status === "CANCEL" || status === "CANCELED";
}

function usageRows(value: RawRecord[]) {
  const unique = new Map<number, UsageRow>();

  for (const row of value) {
    if (isCanceledUsage(row)) continue;

    const id = Number(row.id);
    const reserveId = Number(row.reserveId ?? row.id);
    const date = dateKey(row.reservationDay ?? row.createdAt);
    if (!Number.isInteger(reserveId) || !date) continue;

    unique.set(reserveId, {
      id: Number.isInteger(id) ? id : reserveId,
      reserveId,
      date,
      amount: Number(row.price || 0),
    });
  }

  return [...unique.values()].sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
}

function usageDailyRows(rows: UsageRow[]) {
  const dailyMap = new Map<string, { date: string; amount: number; count: number }>();

  for (const row of rows) {
    const daily = dailyMap.get(row.date) ?? { date: row.date, amount: 0, count: 0 };
    daily.amount += row.amount;
    daily.count += 1;
    dailyMap.set(row.date, daily);
  }

  return [...dailyMap.values()].sort((a, b) => a.date.localeCompare(b.date));
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, mapper: (item: T) => Promise<R>) {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await mapper(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function fetchUsageHistory(
  year: number,
  month: number,
  point: "bank" | "baseball",
  pickupProduct?: boolean,
) {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const startDay = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDay = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const pageSize = 500;

  const getPage = async (page: number) => {
    const params = new URLSearchParams({
      page: String(page),
      size: String(pageSize),
      point,
      reservationStartDay: startDay,
      reservationEndDay: endDay,
    });
    if (pickupProduct !== undefined) params.set("pickupProduct", String(pickupProduct));

    const pageData = unwrap<RawRecord>(
      await fetchJson(`${API_BASE}/v4/bread-storage/reserve-history?${params.toString()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    ) ?? {};

    return {
      rows: Array.isArray(pageData.content) ? (pageData.content as RawRecord[]) : [],
      totalPages: Math.max(1, Number(pageData.totalPages || 1)),
    };
  };

  const first = await getPage(0);
  if (first.totalPages <= 1) return first.rows;

  const remaining = await mapWithConcurrency(
    Array.from({ length: first.totalPages - 1 }, (_, index) => index + 1),
    4,
    async (page) => (await getPage(page)).rows,
  );
  return [first.rows, ...remaining].flat();
}

export function isValidSettlementPeriod(year: number, month: number) {
  return Number.isInteger(year) && year >= 2020 && Number.isInteger(month) && month >= 1 && month <= 12;
}

export async function getSalesSettlementData(year: number, month: number): Promise<SalesSettlementData> {
  if (!isValidSettlementPeriod(year, month)) throw new Error("올바른 year, month가 필요합니다.");

  const monthParams = `year=${year}&month=${month}`;

  const [bankRaw, photoRaw, pickupHistoryRaw, baseballHistoryRaw] = await Promise.all([
    fetchJson(`${API_BASE}/v4/sales-info/month?${monthParams}&point=bank`),
    fetchJson(`${API_BASE}/v4/sales-info/photo-card/month?${monthParams}`, {
      headers: { Accept: "application/json, text/plain, */*" },
    }),
    fetchUsageHistory(year, month, "bank", true),
    fetchUsageHistory(year, month, "baseball"),
  ]);

  const pickupUsage = usageRows(pickupHistoryRaw);
  const baseballUsage = usageRows(baseballHistoryRaw);
  const reserveIds = pickupUsage.map((row) => row.reserveId);
  const detailPairs = await mapWithConcurrency(reserveIds, 12, async (reserveId) => {
    try {
      const details = await fetchJson(
        `${API_BASE}/v4/bread-storage/reserve-user-detail?id=${reserveId}&point=bank`,
        { method: "POST", headers: { Accept: "application/json, text/plain, */*" } },
      );
      return [reserveId, Array.isArray(details) ? (details as RawRecord[]) : []] as const;
    } catch {
      return [reserveId, [] as RawRecord[]] as const;
    }
  });
  const detailMap = new Map(detailPairs);

  const pickupLedger = pickupUsage.map((row) => {
    const details = detailMap.get(row.reserveId) ?? [];
    const detailTypes = details.map((item) => Number(item.type)).filter(Number.isInteger);
    const types = detailTypes.length ? detailTypes : [0];
    const category = types.includes(2) ? "carrier" : types.includes(1) ? "room" : "cold";
    const baseFee = types.reduce((sum, type) => sum + (type === 1 ? 4000 : 5000), 0) || 5000;
    return { ...row, type: "payment" as const, category, storageFee: baseFee };
  });

  const pickupMap = new Map<string, RawRecord>();
  for (const row of pickupLedger) {
    const daily = pickupMap.get(row.date) ?? {
      date: row.date,
      amount: 0,
      count: 0,
      storageFee: 0,
      coldCount: 0,
      coldAmount: 0,
      roomCount: 0,
      roomAmount: 0,
      carrierCount: 0,
      carrierAmount: 0,
    };
    daily.amount = Number(daily.amount) + row.amount;
    daily.count = Number(daily.count) + 1;
    daily.storageFee = Number(daily.storageFee) + row.storageFee;
    daily[`${row.category}Count`] = Number(daily[`${row.category}Count`]) + 1;
    daily[`${row.category}Amount`] = Number(daily[`${row.category}Amount`]) + row.amount;
    pickupMap.set(row.date, daily);
  }

  const photo = unwrap<RawRecord>(photoRaw) ?? {};
  const photoDaily = Array.isArray(photo.daily) ? (photo.daily as RawRecord[]) : [];

  return {
    year,
    month,
    bank: monthRows(bankRaw),
    baseball: usageDailyRows(baseballUsage),
    photoCard: photoDaily
      .map((row) => ({
        date: dateKey(row.date),
        amount: Number(row.cardAmount ?? row.totalAmount ?? 0),
        count: Number(row.count || 0),
      }))
      .filter((row) => row.date && (row.amount !== 0 || row.count !== 0))
      .sort((a, b) => a.date.localeCompare(b.date)),
    pickupDaily: [...pickupMap.values()]
      .sort((a, b) => String(a.date).localeCompare(String(b.date))) as SalesSettlementData["pickupDaily"],
    pickupLedger: pickupLedger.map((row) => ({
      id: row.id,
      date: row.date,
      amount: row.amount,
      type: row.type,
      reserveId: row.reserveId,
    })),
  };
}
