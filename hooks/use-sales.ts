"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getDailySales, getMonthSales } from "@/lib/sales/api";
import { mapSalesDashboardData } from "@/lib/sales/mapper";
import type { PointKey, SalesDashboardData } from "@/lib/sales/types";

type Params = {
  year: number;
  month: number;
  date: string;
  point: PointKey;
};

export function useSales(params: Params) {
  const [data, setData] = useState<SalesDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [monthItems, dailyItems] = await Promise.all([
        getMonthSales({
          year: params.year,
          month: params.month,
          point: params.point,
        }),
        getDailySales({
          date: params.date,
          point: params.point,
        }),
      ]);

      setData(mapSalesDashboardData(monthItems, dailyItems));
    } catch (err) {
      setError(err instanceof Error ? err.message : "매출 데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [params.year, params.month, params.date, params.point]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return useMemo(
    () => ({
      data,
      loading,
      error,
      refetch: fetchData,
    }),
    [data, loading, error, fetchData],
  );
}