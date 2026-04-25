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
      setDetailItems(result);
      if (result.length === 0) {
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

      <SalesManualModal
        open={manualModalOpen}
        point={point}
        loading={submitting}
        onClose={() => setManualModalOpen(false)}
        onSubmit={async (payload) => {
          await submitManualSales(payload);
        }}
      />

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
