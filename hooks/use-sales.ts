"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createManualSales,
  getDailySales,
  getMonthSales,
  getPrepaidSummary,
} from "@/lib/sales/api";
import {
  buildPrepaidSummaryFromMonthRows,
  mapSalesDashboardData,
} from "@/lib/sales/mapper";
import type {
  DailySalesApiResponse,
  ManualSalesRequest,
  PointKey,
  SalesDashboardData,
  SalesPeriodType,
} from "@/lib/sales/types";

type Params = {
  periodType: SalesPeriodType;
  year: number;
  month: number;
  date: string;
  point: PointKey;
};

const EMPTY_DAILY_DATA: DailySalesApiResponse = {
  date: "",
  coldCount: 0,
  roomCount: 0,
  carrierCount: 0,
  baseCount: 0,
  addCount: 0,
  baseAmount: 0,
  addAmount: 0,
  cancelAmount: 0,
  paymentAmount: 0,
  netAmount: 0,
  items: [],
};

export function useSales(params: Params) {
  const [data, setData] = useState<SalesDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
        let prepaidSummary =
          buildPrepaidSummaryFromMonthRows(monthItems, params.point) ?? null;

        if (params.point === "bank") {
          try {
            prepaidSummary = await getPrepaidSummary(params.point);
          } catch {
            prepaidSummary =
              buildPrepaidSummaryFromMonthRows(monthItems, params.point) ?? null;
          }
        }

        setData(mapSalesDashboardData(monthItems, EMPTY_DAILY_DATA, prepaidSummary));
      } else {
        const dailyData = await getDailySales({
          date: params.date,
          point: params.point,
        });

        setData(mapSalesDashboardData([], dailyData, null));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "매출 데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [params.periodType, params.year, params.month, params.date, params.point]);

  const submitManualSales = useCallback(
    async (payload: ManualSalesRequest) => {
      setSubmitting(true);
      setError("");

      try {
        const result = await createManualSales(payload);
        await fetchData();
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "수동 매출 등록에 실패했습니다.";
        setError(message);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [fetchData],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return useMemo(
    () => ({
      data,
      loading,
      submitting,
      error,
      refetch: fetchData,
      submitManualSales,
    }),
    [data, loading, submitting, error, fetchData, submitManualSales],
  );
}
