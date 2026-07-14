import "server-only";
import type { PointKey, SalesCarryoverSummary } from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.trim().replace(/\/+$/, "") ||
  "https://cloud.1472.ai:18443/api";

type RawRecord = Record<string, unknown>;

function unwrap(value: unknown): unknown {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as RawRecord;
    if ("data" in record) return record.data;
    if ("result" in record) return record.result;
    if ("payload" in record) return record.payload;
  }
  return value;
}

async function fetchJson(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, cache: "no-store" });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`upstream ${response.status}: ${text.slice(0, 200)}`);
  }
  return text ? JSON.parse(text) : null;
}

function yearMonth(value: unknown) {
  if (Array.isArray(value) && value.length >= 2) {
    return `${value[0]}-${String(value[1]).padStart(2, "0")}`;
  }
  return String(value ?? "").match(/\d{4}-\d{2}/)?.[0] ?? "";
}

function previousPeriod(year: number, month: number) {
  const date = new Date(Date.UTC(year, month - 2, 1));
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    key: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`,
    endDate: `${lastDay.getUTCFullYear()}-${String(lastDay.getUTCMonth() + 1).padStart(2, "0")}-${String(lastDay.getUTCDate()).padStart(2, "0")}`,
  };
}

async function getBankCarryover(year: number, month: number) {
  const previous = previousPeriod(year, month);
  const raw = unwrap(
    await fetchJson(
      `${API_BASE}/v4/sales-info/prepaid-summary?point=bank&baseDate=${previous.endDate}`,
    ),
  ) as RawRecord | null;
  return Number(raw?.prepaidNextMonthAmount || 0);
}

async function getBaseballCarryover(year: number, month: number) {
  const previous = previousPeriod(year, month);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const startDay = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDay = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const pageSize = 500;

  const getPage = async (page: number) => {
    const params = new URLSearchParams({
      page: String(page),
      size: String(pageSize),
      point: "baseball",
      reservationStartDay: startDay,
      reservationEndDay: endDay,
    });
    const raw = unwrap(
      await fetchJson(`${API_BASE}/v4/bread-storage/reserve-history?${params.toString()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    ) as RawRecord | null;

    return {
      rows: Array.isArray(raw?.content) ? (raw.content as RawRecord[]) : [],
      totalPages: Math.max(1, Number(raw?.totalPages || 1)),
    };
  };

  const first = await getPage(0);
  const remaining = await Promise.all(
    Array.from({ length: first.totalPages - 1 }, (_, index) => getPage(index + 1)),
  );
  const unique = new Map<number, number>();

  for (const row of [first, ...remaining].flatMap((page) => page.rows)) {
    const status = String(row.reservationStatus ?? "").toUpperCase();
    if (status === "CANCEL" || status === "CANCELED") continue;
    if (yearMonth(row.createdAt) !== previous.key) continue;

    const reserveId = Number(row.reserveId ?? row.id);
    if (!Number.isInteger(reserveId)) continue;
    unique.set(reserveId, Number(row.price || 0));
  }

  return {
    amount: [...unique.values()].reduce((sum, price) => sum + price, 0),
    count: unique.size,
  };
}

export function isCarryoverPoint(point: string): point is Extract<PointKey, "bank" | "baseball"> {
  return point === "bank" || point === "baseball";
}

export async function getSalesCarryoverSummary(
  year: number,
  month: number,
  point: Extract<PointKey, "bank" | "baseball">,
): Promise<SalesCarryoverSummary> {
  const baseball = point === "baseball" ? await getBaseballCarryover(year, month) : null;
  const amount = baseball?.amount ?? (await getBankCarryover(year, month));

  return {
    year,
    month,
    point,
    amount,
    count: baseball?.count ?? null,
  };
}
