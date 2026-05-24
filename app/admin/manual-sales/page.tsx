"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LoginCard } from "@/components/auth/login-card";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminShell } from "@/components/admin/admin-shell";
import { StatusBanner } from "@/components/admin/status-banner";
import { SalesManualModal } from "@/components/sales/sales-manual-modal";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { formatPrice } from "@/lib/common";
import { createManualSales, getManualSales } from "@/lib/sales/api";
import {
  getPaymentTypeLabel,
  getPointLabel,
} from "@/lib/sales/mapper";
import type {
  DailySalesApiItem,
  ManualSalesRequest,
  ManualSalesViewRow,
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

function parseFlexibleDate(value?: string | number[] | null) {
  if (!value) return null;

  if (Array.isArray(value) && value.length >= 5) {
    const [year, month, day, hour, minute, second = 0] = value;
    const parsed = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    );

    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (Array.isArray(value)) return null;

  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;

  const commaNumbers = String(value)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => Number(part));

  if (
    commaNumbers.length >= 6 &&
    commaNumbers.slice(0, 6).every((part) => Number.isFinite(part))
  ) {
    const [year, month, day, hour, minute, second] = commaNumbers;
    return new Date(year, month - 1, day, hour, minute, second);
  }

  const normalized = String(value).trim();
  const looseMatch = normalized.match(
    /^(\d{4})\D?(\d{1,2})\D?(\d{1,2})(?:\D+(\d{1,2})(?:\D?(\d{1,2})(?:\D?(\d{1,2}))?)?)?$/,
  );

  if (looseMatch) {
    const year = Number(looseMatch[1]);
    const month = Number(looseMatch[2]);
    const day = Number(looseMatch[3]);
    const hour = Number(looseMatch[4] ?? 0);
    const minute = Number(looseMatch[5] ?? 0);
    const second = Number(looseMatch[6] ?? 0);

    if (
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= 31 &&
      hour >= 0 &&
      hour <= 23 &&
      minute >= 0 &&
      minute <= 59 &&
      second >= 0 &&
      second <= 59
    ) {
      return new Date(year, month - 1, day, hour, minute, second);
    }
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

  if (digits.length >= 8 && digits.length <= 13) {
    const year = Number(digits.slice(0, 4));
    const rest = digits.slice(4);
    const patterns = [
      [2, 2, 2, 2, 2],
      [1, 2, 2, 2, 2],
      [2, 1, 2, 2, 2],
      [1, 1, 2, 2, 2],
      [2, 2, 1, 2, 2],
      [1, 2, 1, 2, 2],
      [2, 1, 1, 2, 2],
      [1, 1, 1, 2, 2],
      [2, 2, 2, 1, 2],
      [1, 2, 2, 1, 2],
      [2, 1, 2, 1, 2],
      [1, 1, 2, 1, 2],
      [2, 2, 1, 1, 2],
      [1, 2, 1, 1, 2],
      [2, 1, 1, 1, 2],
      [1, 1, 1, 1, 2],
      [2, 2, 2, 2, 1],
      [1, 2, 2, 2, 1],
      [2, 1, 2, 2, 1],
      [1, 1, 2, 2, 1],
      [2, 2, 1, 2, 1],
      [1, 2, 1, 2, 1],
      [2, 1, 1, 2, 1],
      [1, 1, 1, 2, 1],
      [2, 2, 2, 1, 1],
      [1, 2, 2, 1, 1],
      [2, 1, 2, 1, 1],
      [1, 1, 2, 1, 1],
      [2, 2, 1, 1, 1],
      [1, 2, 1, 1, 1],
      [2, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [2, 2, 2, 2],
      [1, 2, 2, 2],
      [2, 1, 2, 2],
      [1, 1, 2, 2],
      [2, 2, 1, 2],
      [1, 2, 1, 2],
      [2, 1, 1, 2],
      [1, 1, 1, 2],
      [2, 2, 2, 1],
      [1, 2, 2, 1],
      [2, 1, 2, 1],
      [1, 1, 2, 1],
      [2, 2, 1, 1],
      [1, 2, 1, 1],
      [2, 1, 1, 1],
      [1, 1, 1, 1],
    ];

    for (const pattern of patterns) {
      const totalLength = pattern.reduce((sum, current) => sum + current, 0);
      if (totalLength !== rest.length) continue;

      let cursor = 0;
      const parts = pattern.map((length) => {
        const part = Number(rest.slice(cursor, cursor + length));
        cursor += length;
        return part;
      });

      const [month, day, hour, minute, second = 0] = parts;

      if (
        month >= 1 &&
        month <= 12 &&
        day >= 1 &&
        day <= 31 &&
        hour >= 0 &&
        hour <= 23 &&
        minute >= 0 &&
        minute <= 59 &&
        second >= 0 &&
        second <= 59
      ) {
        return new Date(year, month - 1, day, hour, minute, second);
      }
    }
  }

  return null;
}

function formatDateTimeLabel(value?: string | number[] | null) {
  const date = parseFlexibleDate(value);
  if (!date) return typeof value === "string" ? value : "-";

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
}

function mapManualSalesRows(rows: DailySalesApiItem[]): ManualSalesViewRow[] {
  return rows
    .map((row) => {
      const rowTypeCode = extractCode(row.type);
      const payTypeCode = extractCode(row.payType);

      if (rowTypeCode !== "0") return null;
      if (payTypeCode !== "1" && payTypeCode !== "2") return null;
      if (!row.memo?.trim()) return null;

      return {
        id: row.id,
        reserveId: row.storageId ?? null,
        createdAt: row.createdAt,
        createdAtLabel: formatDateTimeLabel(row.createdAt),
        price: Number(row.price || 0),
        priceLabel: formatPrice(Number(row.price || 0)),
        payTypeCode,
        payTypeLabel: getPaymentTypeLabel(row.payType),
        point: row.point || "-",
        pointLabel: getPointLabel(row.point),
        memo: row.memo.trim(),
      };
    })
    .filter((row): row is ManualSalesViewRow => row !== null);
}

type ManualSalesFiltersProps = {
  point: PointKey;
  startDate: string;
  endDate: string;
  loading: boolean;
  onChangePoint: (value: PointKey) => void;
  onChangeStartDate: (value: string) => void;
  onChangeEndDate: (value: string) => void;
  onRefresh: () => void;
};

function ManualSalesFilters({
  point,
  startDate,
  endDate,
  loading,
  onChangePoint,
  onChangeStartDate,
  onChangeEndDate,
  onRefresh,
}: ManualSalesFiltersProps) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur sm:p-5">
      <div className="grid gap-3 md:grid-cols-[180px_200px_200px_140px]">
        <label className="space-y-2">
          <div className="text-sm font-black text-slate-700">지점</div>
          <select
            value={point}
            onChange={(event) => onChangePoint(event.target.value as PointKey)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-slate-400"
          >
            <option value="bank">은행점</option>
            <option value="sungsim">으능정이점</option>
            <option value="baseball">야구장점</option>
          </select>
        </label>

        <label className="space-y-2">
          <div className="text-sm font-black text-slate-700">시작일</div>
          <input
            type="date"
            value={startDate}
            onChange={(event) => onChangeStartDate(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-slate-400"
          />
        </label>

        <label className="space-y-2">
          <div className="text-sm font-black text-slate-700">종료일</div>
          <input
            type="date"
            value={endDate}
            onChange={(event) => onChangeEndDate(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-slate-400"
          />
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "조회 중..." : "새로고침"}
          </button>
        </div>
      </div>
    </section>
  );
}

type ManualSalesTableProps = {
  rows: ManualSalesViewRow[];
  loading: boolean;
  onClickAdd: () => void;
};

function ManualSalesTable({
  rows,
  loading,
  onClickAdd,
}: ManualSalesTableProps) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-lg font-black text-slate-900">수동 매출 리스트</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            메모가 있는 카드·현금 기본결제만 보여줍니다.
          </p>
        </div>

        <button
          type="button"
          onClick={onClickAdd}
          className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
        >
          수동 매출 추가
        </button>
      </div>

      <div className="hidden md:block">
        <table className="min-w-full table-fixed">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              <th className="px-5 py-4">등록시각</th>
              <th className="px-5 py-4">금액</th>
              <th className="px-5 py-4">결제수단</th>
              <th className="px-5 py-4">지점</th>
              <th className="px-5 py-4">메모</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-16 text-center text-sm font-semibold text-slate-500"
                >
                  {loading
                    ? "수동 매출 데이터를 불러오는 중입니다."
                    : "조회된 수동 매출이 없습니다."}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-slate-100 text-sm text-slate-700"
                >
                  <td className="px-5 py-4 font-semibold text-slate-800">
                    {row.createdAtLabel}
                  </td>
                  <td className="px-5 py-4 font-black text-slate-900">
                    {row.priceLabel}
                  </td>
                  <td className="px-5 py-4 font-semibold">{row.payTypeLabel}</td>
                  <td className="px-5 py-4 font-semibold">{row.pointLabel}</td>
                  <td className="px-5 py-4 font-medium text-slate-600">
                    {row.memo}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-slate-100 md:hidden">
        {rows.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm font-semibold text-slate-500">
            {loading
              ? "수동 매출 데이터를 불러오는 중입니다."
              : "조회된 수동 매출이 없습니다."}
          </div>
        ) : (
          rows.map((row) => (
            <article key={row.id} className="space-y-3 px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-black text-slate-900">
                    {row.priceLabel}
                  </div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">
                    {row.createdAtLabel}
                  </div>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                  {row.payTypeLabel}
                </div>
              </div>

              <div className="text-sm font-semibold text-slate-600">
                {row.pointLabel}
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
                {row.memo}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export default function AdminManualSalesPage() {
  const auth = useAdminAuth();
  const today = getTodayDateString();

  const [point, setPoint] = useState<PointKey>("bank");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [rows, setRows] = useState<ManualSalesViewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorText("");

    try {
      const result = await getManualSales({
        startDate,
        endDate,
        point,
      });

      setRows(mapManualSalesRows(result));
    } catch (error) {
      setRows([]);
      setErrorText(
        error instanceof Error
          ? error.message
          : "수동 매출 데이터를 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, [endDate, point, startDate]);

  useEffect(() => {
    if (!auth.booting && auth.authenticated) {
      void fetchData();
    }
  }, [auth.authenticated, auth.booting, fetchData]);

  const summary = useMemo(() => {
    const totals = rows.reduce(
      (acc, row) => {
        acc.total += row.price;

        if (row.payTypeCode === "1") {
          acc.card += row.price;
        }

        if (row.payTypeCode === "2") {
          acc.cash += row.price;
        }

        return acc;
      },
      {
        total: 0,
        card: 0,
        cash: 0,
      },
    );

    return {
      totalAmountLabel: formatPrice(totals.total),
      cardAmountLabel: formatPrice(totals.card),
      cashAmountLabel: formatPrice(totals.cash),
      countLabel: `${rows.length}건`,
    };
  }, [rows]);

  async function handleSubmitManualSales(payload: ManualSalesRequest) {
    setSubmitting(true);

    try {
      await createManualSales(payload);
      await fetchData();
    } finally {
      setSubmitting(false);
    }
  }

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
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-black text-slate-500">조회 합계</div>
            <div className="mt-2 text-3xl font-black tracking-tight text-slate-900">
              {summary.totalAmountLabel}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-black text-slate-500">카드</div>
            <div className="mt-2 text-3xl font-black tracking-tight text-slate-900">
              {summary.cardAmountLabel}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-black text-slate-500">현금</div>
            <div className="mt-2 text-3xl font-black tracking-tight text-slate-900">
              {summary.cashAmountLabel}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-black text-slate-500">조회 건수</div>
            <div className="mt-2 text-3xl font-black tracking-tight text-slate-900">
              {summary.countLabel}
            </div>
          </div>
        </section>

        <ManualSalesFilters
          point={point}
          startDate={startDate}
          endDate={endDate}
          loading={loading}
          onChangePoint={setPoint}
          onChangeStartDate={setStartDate}
          onChangeEndDate={setEndDate}
          onRefresh={() => void fetchData()}
        />

        {errorText ? <StatusBanner type="error" text={errorText} /> : null}

        <ManualSalesTable
          rows={rows}
          loading={loading}
          onClickAdd={() => setManualModalOpen(true)}
        />
      </div>

      {manualModalOpen ? (
        <SalesManualModal
          open={manualModalOpen}
          point={point}
          initialDate={endDate}
          loading={submitting}
          onClose={() => setManualModalOpen(false)}
          onSubmit={handleSubmitManualSales}
        />
      ) : null}
    </AdminShell>
  );
}
