import type {
  DailySalesApiResponse,
  ManualSalesRequest,
  ManualSalesResponse,
  MonthSalesApiItem,
  PointKey,
} from "./types";

type GetMonthSalesParams = {
  year: number;
  month: number;
  point: PointKey;
};

type GetDailySalesParams = {
  date: string;
  point: PointKey;
};

async function parseJsonSafely(response: Response) {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function getMonthSales(params: GetMonthSalesParams) {
  const searchParams = new URLSearchParams({
    year: String(params.year),
    month: String(params.month),
    point: params.point,
  });

  const response = await fetch(`/api/sales/month?${searchParams.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(
      (data as { message?: string } | null)?.message ||
        "월별 매출 데이터를 불러오지 못했습니다.",
    );
  }

  return (data ?? []) as MonthSalesApiItem[];
}

export async function getDailySales(params: GetDailySalesParams) {
  const searchParams = new URLSearchParams({
    date: params.date,
    point: params.point,
  });

  const response = await fetch(`/api/sales/daily?${searchParams.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(
      (data as { message?: string } | null)?.message ||
        "일별 매출 데이터를 불러오지 못했습니다.",
    );
  }

  return (data ?? null) as DailySalesApiResponse;
}

export async function createManualSales(params: ManualSalesRequest) {
  const response = await fetch("/api/sales/manual", {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(
      (data as { message?: string } | null)?.message ||
        "수동 매출을 등록하지 못했습니다.",
    );
  }

  return (data ?? null) as ManualSalesResponse;
}