import type {
  DailySalesApiResponse,
  DailySalesApiItem,
  ManualSalesRequest,
  ManualSalesResponse,
  MonthSalesApiItem,
  PhotoCardSalesDailyResponse,
  PhotoCardSalesMonthResponse,
  PointKey,
  SalesPrepaidSummary,
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

type GetManualSalesParams = {
  startDate: string;
  endDate: string;
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

function unwrapPayload<T>(payload: unknown) {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    if ("data" in record) return record.data as T;
    if ("result" in record) return record.result as T;
    if ("payload" in record) return record.payload as T;
  }

  return payload as T;
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

export async function getPhotoCardMonthSales(params: {
  year: number;
  month: number;
}) {
  const searchParams = new URLSearchParams({
    year: String(params.year),
    month: String(params.month),
  });

  const response = await fetch(
    `/api/photo-card-sales/month?${searchParams.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(
      (data as { message?: string } | null)?.message ||
        "사진매출 월별 데이터를 불러오지 못했습니다.",
    );
  }

  return unwrapPayload<PhotoCardSalesMonthResponse | null>(data ?? null);
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

export async function getPhotoCardDailySales(params: { date: string }) {
  const searchParams = new URLSearchParams({
    date: params.date,
  });

  const response = await fetch(
    `/api/photo-card-sales/daily?${searchParams.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(
      (data as { message?: string } | null)?.message ||
        "사진매출 일별 데이터를 불러오지 못했습니다.",
    );
  }

  return unwrapPayload<PhotoCardSalesDailyResponse | null>(data ?? null);
}

export async function getPrepaidSummary(point: PointKey) {
  const searchParams = new URLSearchParams({ point });

  const response = await fetch(`/api/sales/prepaid-summary?${searchParams.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(
      (data as { message?: string } | null)?.message ||
        "선결제 데이터를 불러오지 못했습니다.",
    );
  }

  return (data ?? null) as SalesPrepaidSummary;
}

export async function getManualSales(params: GetManualSalesParams) {
  const searchParams = new URLSearchParams({
    startDate: params.startDate,
    endDate: params.endDate,
    point: params.point,
  });

  const response = await fetch(`/api/sales/manual?${searchParams.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(
      (data as { message?: string } | null)?.message ||
        "수동 매출 데이터를 불러오지 못했습니다.",
    );
  }

  return (Array.isArray(data) ? data : []) as DailySalesApiItem[];
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
