"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LoginCard } from "@/components/auth/login-card";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminShell } from "@/components/admin/admin-shell";
import { StatusBanner } from "@/components/admin/status-banner";
import { SalesManualModal } from "@/components/sales/sales-manual-modal";
import { createManualSales, getDailySales } from "@/lib/sales/api";
import {
  getPaymentTypeLabel,
  getPointLabel,
} from "@/lib/sales/mapper";
import { formatPrice } from "@/lib/common";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import type {
  DailySalesApiItem,
  ManualSalesRequest,
  PointKey,
} from "@/lib/sales/types";

function getTodayDateString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function extractCode(raw?: string | number | null) {
  if (raw === null || raw === undefined) return "";

  const text = String(raw).trim();
  if (!text) return "";

  if (/^\d+$/.test(text)) return text;

  const leading = text.match(/^(\d+)\s*=/);
  if (leading) return leading[1];

  const anyNumber = text.match(/\d+/);
  return anyNumber?.[0] ?? "";
}

function parseFlexibleDate(value?: string | null) {
  if (!value) return null;

  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;

  const commaNumbers = String(value)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => Number(part));

  if (
    commaNumbers.length >= 6 &&
    commaNumbers.slice(0, 6).every((v) => Number.isFinite(v))
  ) {
    const [year, month, day, hour, minute, second] = commaNumbers;
    return new Date(year, month - 1, day, hour, minute, second);
  }

  const digits = String(value).replace(/[^\d]/g, "");
  if (digits.length >= 14) {
    const year = Number(digits.slice(0, 4));
    const month = Number(digits.slice(4, 6));
    const day = Number(digits.slice(6, 8));
    const hour = Number(digits.slice(8, 10));
    const minute = Number(digits.slice(10, 12));
    const second = Number(digits.slice(12, 14));
    return new Date(year, month - 1, day, hour, minute, second);
  }

  return null;
}

function formatDateTimeLabel(value?: string | null) {
  const date = parseFlexibleDate(value);
  if (!date) return value || "-";

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
}

type ManualSalesRow = {
  id: number;
  createdAt: string;
  createdAtLabel: string;
  price: number;
  priceLabel: string;
  payTypeCode: string;
  payTypeLabel: string;
  point: string;
  pointLabel: string;
  memo: string;
};

function mapManualSalesRows(rows: DailySalesApiItem[]): ManualSalesRow[] {
  return [...rows]
    .filter((row) => {
      const payTypeCode = extractCode(row.payType);
      const rowTypeCode = extractCode(row.type);
      const memo = row.memo?.trim() || "";

      return rowTypeCode === "0" && (payTypeCode === "1" || payTypeCode === "2") && !!memo;
    })
    .map((row) => {
      const payTypeCode = extractCode(row.payType);

      return {
        id: row.id,
        createdAt: row.createdAt,
        createdAtLabel: formatDateTimeLabel(row.createdAt),
        price: Number(row.price || 0),
        priceLabel: formatPrice(Number(row.price || 0)),
        payTypeCode,
        payTypeLabel: getPaymentTypeLabel(row.payType),
        point: row.point || "-",
        pointLabel: getPointLabel(row.point),
        memo: row.memo?.trim() || "-",
      };
    })
    .sort((a, b) => {
      const aDate = parseFlexibleDate(a.createdAt)?.getTime() ?? 0;
      const bDate = parseFlexibleDate(b.createdAt)?.getTime() ?? 0;
      return bDate - aDate;
    });
}

function ManualSalesFilters({
  point,
  date,
  loading,
  onChangePoint,
  onChangeDate,
  onRefresh,
}: {
  point: PointKey;
  date: string;
  loading: boolean;
  onChangePoint: (value: PointKey) => void;
  onChangeDate: (value: string) => void;
  onRefresh: () => void;
}) {
  return (
    <section className="rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur sm:p-5">
      <div className="grid gap-3 md:grid-cols-[180px_200px_140px]">
        <label className="space-y-2">
          <div className="text-[13px] font-black text-slate-500">지점</div>
          <select
            value={point}
            onChange={(e) => onChangePoint(e.target.value as PointKey)}
            disabled={loading}
            className="w-full rounded-[18px] border border-slate-200 px-4 py-3 text-[15px] font-bold text-slate-800 outline-none focus:border-slate-400"
          >
            <option value="bank">은행점</option>
            <option value="sungsim">으능정이점</option>
            <option value="baseball">야구장점</option>
          </select>
        </label>

        <label className="space-y-2">
          <div className="text-[13px] font-black text-slate-500">날짜</div>
          <input
            type="date"
            value={date}
            onChange={(e) => onChangeDate(e.target.value)}
            disabled={loading}
            className="w-full rounded-[18px] border border-slate-200 px-4 py-3 text-[15px] font-bold text-slate-800 outline-none focus:border-slate-400"
          />
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-[15px] font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            새로고침
          </button>
        </div>
      </div>
    </section>
  );
}

function ManualSalesTable({
  rows,
  loading,
  onClickAdd,
}: {
  rows: ManualSalesRow[];
  loading: boolean;
  onClickAdd: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-white/70 bg-white/90 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <div className="text-[18px] font-black tracking-[-0.03em] text-slate-900">
            수동 매출 리스트
          </div>
          <div className="mt-1 text-[13px] font-semibold text-slate-500">
            메모가 있는 카드/현금 기본결제만 표시
          </div>
        </div>

        <button
          type="button"
          onClick={onClickAdd}
          className="rounded-[18px] bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
        >
          수동 매출 추가
        </button>
      </div>

      {loading ? (
        <div className="px-5 py-10 text-center text-sm font-bold text-slate-500">
          불러오는 중...
        </div>
      ) : rows.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm font-bold text-slate-500">
          표시할 수동 매출이 없습니다.
        </div>
      ) : (
        <>
          <div className="hidden grid-cols-[160px_120px_120px_120px_1fr] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[13px] font-black text-slate-500 md:grid">
            <div>등록시각</div>
            <div>금액</div>
            <div>결제수단</div>
            <div>지점</div>
            <div>메모</div>
          </div>

          <div className="divide-y divide-slate-100">
            {rows.map((row) => (
              <div
                key={row.id}
                className="grid gap-3 px-4 py-4 md:grid-cols-[160px_120px_120px_120px_1fr] md:items-center md:gap-4 md:px-5"
              >
                <div>
                  <div className="text-[12px] font-bold text-slate-400 md:hidden">
                    등록시각
                  </div>
                  <div className="text-[14px] font-bold text-slate-700">
                    {row.createdAtLabel}
                  </div>
                </div>

                <div>
                  <div className="text-[12px] font-bold text-slate-400 md:hidden">
                    금액
                  </div>
                  <div className="text-[15px] font-black text-slate-900">
                    {row.priceLabel}
                  </div>
                </div>

                <div>
                  <div className="text-[12px] font-bold text-slate-400 md:hidden">
                    결제수단
                  </div>
                  <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[13px] font-black text-slate-700">
                    {row.payTypeLabel}
                  </div>
                </div>

                <div>
                  <div className="text-[12px] font-bold text-slate-400 md:hidden">
                    지점
                  </div>
                  <div className="text-[14px] font-bold text-slate-700">
                    {row.pointLabel}
                  </div>
                </div>

                <div>
                  <div className="text-[12px] font-bold text-slate-400 md:hidden">
                    메모
                  </div>
                  <div className="text-[14px] font-semibold leading-6 text-slate-700">
                    {row.memo}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default function AdminManualSalesPage() {
  const auth = useAdminAuth();

  const [point, setPoint] = useState<PointKey>("bank");
  const [date, setDate] = useState(getTodayDateString());
  const [manualModalOpen, setManualModalOpen] = useState(false);

  const [rows, setRows] = useState<ManualSalesRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const dailyData = await getDailySales({
        date,
        point,
      });

      setRows(mapManualSalesRows(dailyData?.items ?? []));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "수동 매출 데이터를 불러오지 못했습니다.",
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [date, point]);

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

  if (auth.booting) {
    return (
      <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#ffe4f1_0%,#fff4fa_35%,#f8fbff_100%)] px-4">
        <div className="rounded-full bg-white px-6 py-3 text-lg font-black text-slate-800 shadow">
          불러오는 중...
        </div>
      </div>
    );
  }

  if (!auth.authenticated) {
    return (
      <LoginCard
        password={auth.password}
        error={auth.loginError}
        loading={auth.loginLoading}
        onChangePassword={auth.setPassword}
        onSubmit={auth.handleLogin}
      />
    );
  }

  return (
    <AdminShell role={auth.role} onLogout={auth.handleLogout}>
      <AdminHeader title="수동매출입력" onLogout={auth.handleLogout} />

      <div className="space-y-4 lg:space-y-6">
        <ManualSalesFilters
          point={point}
          date={date}
          loading={loading}
          onChangePoint={setPoint}
          onChangeDate={setDate}
          onRefresh={fetchData}
        />

        {error ? <StatusBanner type="error" text={error} /> : null}

        <ManualSalesTable
          rows={rows}
          loading={loading}
          onClickAdd={() => setManualModalOpen(true)}
        />
      </div>

      <SalesManualModal
        open={manualModalOpen}
        point={point}
        loading={submitting}
        onClose={() => setManualModalOpen(false)}
        onSubmit={async (payload) => {
          await submitManualSales(payload);
          setManualModalOpen(false);
        }}
      />
    </AdminShell>
  );
}
