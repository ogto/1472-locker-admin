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

function monthRows(value: unknown): SalesSettlementData["bank"] {
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

function settlementDailyRows(value: unknown): SalesSettlementData["baseball"] {
  return (Array.isArray(value) ? value : [])
    .map((item) => item as RawRecord)
    .map((row) => ({
      date: dateKey(row.date),
      amount: Number(row.amount || 0),
      count: Number(row.count || 0),
    }))
    .filter((row) => row.date)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function pickupDailyRows(value: unknown): SalesSettlementData["pickupDaily"] {
  return (Array.isArray(value) ? value : [])
    .map((item) => item as RawRecord)
    .map((row) => ({
      date: dateKey(row.date),
      amount: Number(row.amount || 0),
      count: Number(row.count || 0),
      storageFee: Number(row.storageFee || 0),
      coldCount: Number(row.coldCount || 0),
      coldAmount: Number(row.coldAmount || 0),
      roomCount: Number(row.roomCount || 0),
      roomAmount: Number(row.roomAmount || 0),
      carrierCount: Number(row.carrierCount || 0),
      carrierAmount: Number(row.carrierAmount || 0),
    }))
    .filter((row) => row.date)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function pickupLedgerRows(value: unknown): SalesSettlementData["pickupLedger"] {
  return (Array.isArray(value) ? value : [])
    .map((item) => item as RawRecord)
    .map((row) => ({
      id: Number(row.id),
      date: dateKey(row.date),
      amount: Number(row.amount || 0),
      type: row.type === "cancel" ? ("cancel" as const) : ("payment" as const),
      reserveId: Number(row.reserveId),
    }))
    .filter((row) => Number.isInteger(row.id) && Number.isInteger(row.reserveId) && row.date)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
}

export function isValidSettlementPeriod(year: number, month: number) {
  return Number.isInteger(year) && year >= 2020 && Number.isInteger(month) && month >= 1 && month <= 12;
}

export async function getSalesSettlementData(year: number, month: number): Promise<SalesSettlementData> {
  if (!isValidSettlementPeriod(year, month)) throw new Error("올바른 year, month가 필요합니다.");

  const monthParams = `year=${year}&month=${month}`;
  const [bankRaw, photoRaw, settlementRaw] = await Promise.all([
    fetchJson(`${API_BASE}/v4/sales-info/month?${monthParams}&point=bank`),
    fetchJson(`${API_BASE}/v4/sales-info/photo-card/month?${monthParams}`, {
      headers: { Accept: "application/json, text/plain, */*" },
    }),
    fetchJson(`${API_BASE}/v4/sales-info/settlement-summary?${monthParams}`),
  ]);

  const photo = unwrap<RawRecord>(photoRaw) ?? {};
  const photoDaily = Array.isArray(photo.daily) ? (photo.daily as RawRecord[]) : [];
  const settlement = unwrap<RawRecord>(settlementRaw) ?? {};

  return {
    year,
    month,
    bank: monthRows(bankRaw),
    baseball: settlementDailyRows(settlement.baseball),
    photoCard: photoDaily
      .map((row) => ({
        date: dateKey(row.date),
        amount: Number(row.cardAmount ?? row.totalAmount ?? 0),
        count: Number(row.count || 0),
      }))
      .filter((row) => row.date && (row.amount !== 0 || row.count !== 0))
      .sort((a, b) => a.date.localeCompare(b.date)),
    pickupDaily: pickupDailyRows(settlement.pickupDaily),
    pickupLedger: pickupLedgerRows(settlement.pickupLedger),
  };
}
