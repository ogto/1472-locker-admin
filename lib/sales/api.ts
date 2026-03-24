import type { DailySalesApiItem, MonthSalesApiItem, PointKey } from "./types";

type GetMonthSalesParams = {
  year: number;
  month: number;
  point: PointKey;
};

type GetDailySalesParams = {
  date: string;
  point: PointKey;
};

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

  if (!response.ok) {
    throw new Error("월별 매출 데이터를 불러오지 못했습니다.");
  }

  return (await response.json()) as MonthSalesApiItem[];
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

  if (!response.ok) {
    throw new Error("일별 매출 데이터를 불러오지 못했습니다.");
  }

  return (await response.json()) as DailySalesApiItem[];
}