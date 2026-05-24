"use client";

import { useMemo, useState } from "react";
import { LoginCard } from "@/components/auth/login-card";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminShell } from "@/components/admin/admin-shell";
import { StatusBanner } from "@/components/admin/status-banner";
import { HistoryDetailPanel } from "@/components/history/history-detail-panel";
import { SalesDailyTable } from "@/components/sales/sales-daily-table";
import { SalesFilters } from "@/components/sales/sales-filters";
import { SalesManualModal } from "@/components/sales/sales-manual-modal";
import { SalesMonthCalendar } from "@/components/sales/sales-month-calendar";
import { SalesSummaryCards } from "@/components/sales/sales-summary-cards";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useSales } from "@/hooks/use-sales";
import { formatPrice } from "@/lib/common";
import { fetchReserveHistoryDetail } from "@/lib/history/api";
import {
  buildFilteredDailySummary,
  buildFilteredMonthSummary,
  filterDailyRows,
  mapFilteredMonthRows,
  mapFilteredPaymentRows,
} from "@/lib/sales/mapper";
import type { HistoryDetailItem } from "@/lib/history/types";
import type {
  DailySalesViewRow,
  PointKey,
  SalesPaymentFilter,
  SalesPeriodType,
} from "@/lib/sales/types";

function getTodayDateString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseDateLike(value: unknown) {
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

  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function formatDateLikeLabel(value: unknown) {
  const parsed = parseDateLike(value);
  if (!parsed) return "-";

  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const dd = String(parsed.getDate()).padStart(2, "0");
  const hh = String(parsed.getHours()).padStart(2, "0");
  const mi = String(parsed.getMinutes()).padStart(2, "0");

  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
}

function filterDetailsForSalesRow(
  row: DailySalesViewRow,
  items: HistoryDetailItem[],
) {
  if (row.rowTypeCode !== "1") {
    return items;
  }

  const salesTime = parseDateLike(row.createdAt);
  if (!salesTime) {
    return items;
  }

  const matchedItems = items.filter((item) => {
    const updateTime = parseDateLike(item.updateAt);
    if (!updateTime) return false;

    return Math.abs(updateTime.getTime() - salesTime.getTime()) <= 120_000;
  });

  return matchedItems.length > 0 ? matchedItems : items;
}

function applySalesRowAmountToDetails(
  row: DailySalesViewRow,
  items: HistoryDetailItem[],
) {
  if (row.rowTypeCode !== "1" || items.length === 0) {
    return items;
  }

  if (items.length === 1) {
    return [{ ...items[0], addPay: row.price }];
  }

  return items;
}

type DailyCancelDetail = {
  paymentAtLabel: string;
  cancelAtLabel: string;
};

function DailyCancelListModal({
  rows,
  details,
  loading,
  errorText,
  totalAmount,
  totalCount,
  date,
  onClose,
}: {
  rows: DailySalesViewRow[];
  details: Record<number, DailyCancelDetail>;
  loading: boolean;
  errorText: string;
  totalAmount: number;
  totalCount: number;
  date: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.46)] p-4 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(255,247,249,0.96)_100%)] shadow-[0_24px_80px_rgba(15,23,42,0.22)] sm:rounded-[32px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-rose-100 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="text-[22px] font-black tracking-[-0.03em] text-slate-900">
              당일 취소 내역
            </div>
            <div className="mt-1 text-sm font-bold text-slate-500">
              {date} · 취소 {totalCount.toLocaleString()}건 ·{" "}
              {formatPrice(totalAmount)}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-rose-100 bg-white/90 px-4 py-2.5 text-[14px] font-extrabold text-slate-700 shadow-sm transition hover:bg-rose-50"
          >
            닫기
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
          {errorText ? (
            <div className="mb-3 rounded-[20px] bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">
              {errorText}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-[24px] bg-slate-50 px-5 py-8 text-center text-sm font-bold text-slate-500">
              취소 상세를 불러오는 중입니다.
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-[24px] bg-slate-50 px-5 py-8 text-center text-sm font-bold text-slate-500">
              취소 내역이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-sm font-black text-slate-500">
                    <th className="px-3 py-2">결제일시</th>
                    <th className="px-3 py-2">취소일시</th>
                    <th className="px-3 py-2">이름</th>
                    <th className="px-3 py-2">전화번호</th>
                    <th className="px-3 py-2">구분</th>
                    <th className="px-3 py-2">결제수단</th>
                    <th className="px-3 py-2">취소금액</th>
                    <th className="px-3 py-2">지점</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row) => {
                    const detail = details[row.id];

                    return (
                      <tr
                        key={row.id}
                        className="bg-rose-50/70 text-sm text-slate-500"
                      >
                        <td className="whitespace-nowrap rounded-l-2xl px-3 py-3 font-semibold text-slate-500">
                          {detail?.paymentAtLabel || "-"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 font-semibold text-rose-600">
                          {detail?.cancelAtLabel || row.createdAtLabel || "-"}
                        </td>
                        <td className="px-3 py-3 font-semibold text-slate-700">
                          {row.customerName || "-"}
                        </td>
                        <td className="px-3 py-3">{row.customerTel || "-"}</td>
                        <td className="px-3 py-3">
                          <span className="inline-flex min-w-[58px] items-center justify-center rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-600">
                            취소
                          </span>
                        </td>
                        <td className="px-3 py-3 font-semibold">
                          {row.payTypeLabel || "-"}
                        </td>
                        <td className="px-3 py-3 font-black text-rose-600">
                          {row.priceLabel || formatPrice(row.price)}
                        </td>
                        <td className="rounded-r-2xl px-3 py-3">
                          {row.pointLabel || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminSalesPage() {
  const auth = useAdminAuth();

  const today = useMemo(() => new Date(), []);
  const [periodType, setPeriodType] = useState<SalesPeriodType>("month");
  const [paymentFilter, setPaymentFilter] = useState<SalesPaymentFilter>("all");
  const [point, setPoint] = useState<PointKey>("bank");
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [date, setDate] = useState(getTodayDateString());
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [cancelListModalOpen, setCancelListModalOpen] = useState(false);
  const [cancelListLoading, setCancelListLoading] = useState(false);
  const [cancelListErrorText, setCancelListErrorText] = useState("");
  const [cancelDetails, setCancelDetails] = useState<
    Record<number, DailyCancelDetail>
  >({});
  const [selectedRow, setSelectedRow] = useState<DailySalesViewRow | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailErrorText, setDetailErrorText] = useState("");
  const [detailItems, setDetailItems] = useState<HistoryDetailItem[]>([]);

  const { data, loading, submitting, error, refetch, submitManualSales } = useSales({
    periodType,
    year,
    month,
    date,
    point,
  });

  const filteredData = useMemo(() => {
    if (!data) return null;

    if (periodType === "month") {
      return data;
    }

    return {
      ...data,
      monthRows: mapFilteredMonthRows(data.rawMonthItems, paymentFilter),
      paymentRows: mapFilteredPaymentRows(data.rawMonthItems, paymentFilter),
      monthSummary: buildFilteredMonthSummary(data.rawMonthItems, paymentFilter),
      dailyRows: filterDailyRows(data.dailyRows, paymentFilter),
      dailySummary: buildFilteredDailySummary(
        filterDailyRows(data.dailyRows, paymentFilter),
        data.dailySummary,
        paymentFilter,
      ),
    };
  }, [data, paymentFilter, periodType]);

  function moveMonth(diff: number) {
    const next = new Date(year, month - 1 + diff, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth() + 1);
  }

  const dailyCancelRows = useMemo(() => {
    if (!filteredData || periodType !== "daily") return [];

    return filteredData.dailyRows.filter((row) => row.rowTypeCode === "2");
  }, [filteredData, periodType]);

  async function handleOpenCancelList() {
    setCancelListModalOpen(true);
    setCancelListErrorText("");

    if (dailyCancelRows.length === 0) {
      setCancelDetails({});
      return;
    }

    setCancelListLoading(true);

    try {
      const entries = await Promise.all(
        dailyCancelRows.map(async (row) => {
          let paymentAtLabel = "-";

          if (row.reserveId != null) {
            try {
              const details = await fetchReserveHistoryDetail(
                row.reserveId,
                row.point,
              );
              const matched =
                details.find((item) => item.reserveId === row.reserveId) ??
                details[0];

              paymentAtLabel = formatDateLikeLabel(matched?.createdAt);
            } catch {
              paymentAtLabel = "-";
            }
          }

          return [
            row.id,
            {
              paymentAtLabel,
              cancelAtLabel: formatDateLikeLabel(row.createdAt),
            },
          ] as const;
        }),
      );

      setCancelDetails(Object.fromEntries(entries));
    } catch (error) {
      setCancelDetails({});
      setCancelListErrorText(
        error instanceof Error
          ? error.message
          : "취소 상세를 불러오지 못했습니다.",
      );
    } finally {
      setCancelListLoading(false);
    }
  }

  async function handleClickDailyRow(row: DailySalesViewRow) {
    setSelectedRow(row);
    setDetailModalOpen(true);
    setDetailLoading(true);
    setDetailErrorText("");
    setDetailItems([]);

    if (row.reserveId == null) {
      setDetailErrorText("이 결제에는 연결된 이용내역이 없습니다.");
      setDetailLoading(false);
      return;
    }

    try {
      const result = await fetchReserveHistoryDetail(row.reserveId, row.point);
      const filteredResult = filterDetailsForSalesRow(row, result);
      const displayResult = applySalesRowAmountToDetails(row, filteredResult);
      setDetailItems(displayResult);
      if (displayResult.length === 0) {
        setDetailErrorText("연결된 이용내역이 없습니다.");
      }
    } catch (error) {
      setDetailErrorText(
        error instanceof Error ? error.message : "이용내역 상세 조회에 실패했습니다.",
      );
    } finally {
      setDetailLoading(false);
    }
  }

  if (auth.authenticated && auth.role !== "super-admin") {
    return (
      <AdminShell role={auth.role} onLogout={auth.handleLogout}>
        <section className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-sm font-bold text-rose-600">
          슈퍼관리자만 접근할 수 있습니다.
        </section>
      </AdminShell>
    );
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
    <AdminShell
      role={auth.role}
      onLogout={auth.handleLogout}
      contentClassName="2xl:max-w-[1600px] 3xl:max-w-[1800px]"
    >
      <AdminHeader title="매출관리" onLogout={auth.handleLogout} />

      <div className="space-y-4 lg:space-y-6">
        <div className="flex justify-end">
          <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setPeriodType("month")}
              className={[
                "rounded-xl px-4 py-2 text-sm font-black transition",
                periodType === "month"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-50",
              ].join(" ")}
            >
              월별
            </button>
            <button
              type="button"
              onClick={() => setPeriodType("daily")}
              className={[
                "rounded-xl px-4 py-2 text-sm font-black transition",
                periodType === "daily"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-50",
              ].join(" ")}
            >
              일별
            </button>
          </div>
        </div>

        {periodType === "daily" ? (
          <SalesFilters
            periodType={periodType}
            paymentFilter={paymentFilter}
            point={point}
            year={year}
            month={month}
            date={date}
            loading={loading}
            onChangePaymentFilter={setPaymentFilter}
            onChangePoint={setPoint}
            onChangeYear={setYear}
            onChangeMonth={setMonth}
            onChangeDate={setDate}
            onRefresh={refetch}
          />
        ) : null}

        {error ? <StatusBanner type="error" text={error} /> : null}

        {!filteredData ? (
          <section className="rounded-[28px] border border-slate-200 bg-white px-5 py-10 text-center text-sm font-medium text-slate-500 shadow-sm">
            {loading ? "데이터를 불러오는 중입니다." : "표시할 데이터가 없습니다."}
          </section>
        ) : (
          <>
            {periodType === "month" ? (
              <SalesMonthCalendar
                year={year}
                month={month}
                point={point}
                loading={loading}
                rows={filteredData.rawMonthItems}
                prepaidSummary={filteredData.prepaidSummary}
                onPrevMonth={() => moveMonth(-1)}
                onNextMonth={() => moveMonth(1)}
                onChangePoint={setPoint}
                onRefresh={refetch}
              />
            ) : (
              <>
                <SalesSummaryCards
                  periodType={periodType}
                  monthSummary={filteredData.monthSummary}
                  dailySummary={filteredData.dailySummary}
                  onClickDailyRefund={() => void handleOpenCancelList()}
                />
                <SalesDailyTable
                  rows={filteredData.dailyRows}
                  periodType={periodType}
                  onClickAddManual={() => setManualModalOpen(true)}
                  onClickRow={(row) => void handleClickDailyRow(row)}
                />
              </>
            )}
          </>
        )}
      </div>

      {manualModalOpen ? (
        <SalesManualModal
          open={manualModalOpen}
          point={point}
          loading={submitting}
          onClose={() => setManualModalOpen(false)}
          onSubmit={async (payload) => {
            await submitManualSales(payload);
          }}
        />
      ) : null}

      {cancelListModalOpen ? (
        <DailyCancelListModal
          rows={dailyCancelRows}
          details={cancelDetails}
          loading={cancelListLoading}
          errorText={cancelListErrorText}
          totalAmount={filteredData?.dailySummary.refundAmount ?? 0}
          totalCount={filteredData?.dailySummary.refundCount ?? 0}
          date={date}
          onClose={() => {
            setCancelListModalOpen(false);
            setCancelListErrorText("");
          }}
        />
      ) : null}

      {detailModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.46)] p-4 backdrop-blur-[3px]"
          onClick={() => setDetailModalOpen(false)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(255,247,249,0.96)_100%)] shadow-[0_24px_80px_rgba(15,23,42,0.22)] sm:rounded-[32px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-rose-100 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <div className="text-[22px] font-black tracking-[-0.03em] text-slate-900">
                  결제 연결 이용내역
                </div>
                <div className="mt-1 text-sm font-bold text-slate-500">
                  {selectedRow?.customerName || "-"} · {selectedRow?.customerTel || "-"} · 결제{" "}
                  {selectedRow?.priceLabel || "-"}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-rose-100 bg-white/90 px-4 py-2.5 text-[14px] font-extrabold text-slate-700 shadow-sm transition hover:bg-rose-50"
              >
                닫기
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
              <HistoryDetailPanel
                loading={detailLoading}
                errorText={detailErrorText}
                items={detailItems}
              />
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
