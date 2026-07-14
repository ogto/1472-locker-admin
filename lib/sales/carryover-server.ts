import "server-only";
import type { PointKey, SalesCarryoverSummary } from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.trim().replace(/\/+$/, "") ||
  "https://cloud.1472.ai:18443/api";

export function isCarryoverPoint(point: string): point is Extract<PointKey, "bank" | "baseball"> {
  return point === "bank" || point === "baseball";
}

export async function getSalesCarryoverSummary(
  year: number,
  month: number,
  point: Extract<PointKey, "bank" | "baseball">,
): Promise<SalesCarryoverSummary> {
  const params = new URLSearchParams({
    year: String(year),
    month: String(month),
    point,
  });
  const response = await fetch(
    `${API_BASE}/v4/sales-info/carryover-summary?${params.toString()}`,
    { method: "GET", cache: "no-store" },
  );
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`upstream ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = text ? (JSON.parse(text) as Partial<SalesCarryoverSummary>) : {};
  return {
    year: Number(data.year ?? year),
    month: Number(data.month ?? month),
    point: (data.point ?? point) as PointKey,
    amount: Number(data.amount || 0),
    count: data.count == null ? null : Number(data.count),
  };
}
