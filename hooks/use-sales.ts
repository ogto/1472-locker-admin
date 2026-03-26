"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getDailySales, getMonthSales } from "@/lib/sales/api";
import { mapSalesDashboardData } from "@/lib/sales/mapper";
import type { PointKey, SalesDashboardData, SalesPeriodType } from "@/lib/sales/types";

type Params = {
  periodType: SalesPeriodType;
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
      if (params.periodType === "month") {
        const monthItems = await getMonthSales({
          year: params.year,
          month: params.month,
          point: params.point,
        });

        setData(mapSalesDashboardData(monthItems, []));
      } else {
        const dailyItems = await getDailySales({
          date: params.date,
          point: params.point,
        });

        setData(mapSalesDashboardData([], dailyItems));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "매출 데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [params.periodType, params.year, params.month, params.date, params.point]);

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