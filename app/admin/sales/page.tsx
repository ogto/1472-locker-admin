"use client";

import { useMemo, useState } from "react";
import { LoginCard } from "@/components/auth/login-card";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminShell } from "@/components/admin/admin-shell";
import { StatusBanner } from "@/components/admin/status-banner";
import { SalesDailyTable } from "@/components/sales/sales-daily-table";
import { SalesFilters } from "@/components/sales/sales-filters";
import { SalesManualModal } from "@/components/sales/sales-manual-modal";
import { SalesMonthChart } from "@/components/sales/sales-month-chart";
import { SalesPaymentChart } from "@/components/sales/sales-payment-chart";
import { SalesSummaryCards } from "@/components/sales/sales-summary-cards";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useSales } from "@/hooks/use-sales";
import {
  buildFilteredDailySummary,
  buildFilteredMonthSummary,
  filterDailyRows,
  mapFilteredMonthRows,
  mapFilteredPaymentRows,
} from "@/lib/sales/mapper";
import type { PointKey, SalesPaymentFilter, SalesPeriodType } from "@/lib/sales/types";

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
  const [periodType, setPeriodType] = useState<SalesPeriodType>("daily");
  const [paymentFilter, setPaymentFilter] = useState<SalesPaymentFilter>("all");
  const [point, setPoint] = useState<PointKey>("bank");
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [date, setDate] = useState(getTodayDateString());
  const [manualModalOpen, setManualModalOpen] = useState(false);

  const { data, loading, submitting, error, refetch, submitManualSales } = useSales({
    periodType,
    year,
    month,
    date,
    point,
  });

  const filteredData = useMemo(() => {
    if (!data) return null;

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
  }, [data, paymentFilter]);

  if (auth.authenticated && auth.role !== "super-admin") {
    return (
      <AdminShell role={auth.role}>
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
    <AdminShell role={auth.role}>
      <AdminHeader title="매출관리" onLogout={auth.handleLogout} />

      <div className="space-y-4 lg:space-y-6">
        <SalesFilters
          periodType={periodType}
          paymentFilter={paymentFilter}
          point={point}
          year={year}
          month={month}
          date={date}
          loading={loading}
          onChangePeriodType={setPeriodType}
          onChangePaymentFilter={setPaymentFilter}
          onChangePoint={setPoint}
          onChangeYear={setYear}
          onChangeMonth={setMonth}
          onChangeDate={setDate}
          onRefresh={refetch}
        />

        {error ? <StatusBanner type="error" text={error} /> : null}

        {!filteredData ? (
          <section className="rounded-[28px] border border-slate-200 bg-white px-5 py-10 text-center text-sm font-medium text-slate-500 shadow-sm">
            {loading ? "데이터를 불러오는 중입니다." : "표시할 데이터가 없습니다."}
          </section>
        ) : (
          <>
            <SalesSummaryCards
              periodType={periodType}
              monthSummary={filteredData.monthSummary}
              dailySummary={filteredData.dailySummary}
            />

            {periodType === "month" ? (
              <div className="grid gap-5 xl:grid-cols-2">
                <SalesMonthChart rows={filteredData.monthRows} />
                <SalesPaymentChart rows={filteredData.paymentRows} />
              </div>
            ) : (
              <SalesDailyTable
                rows={filteredData.dailyRows}
                periodType={periodType}
                onClickAddManual={() => setManualModalOpen(true)}
              />
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
    </AdminShell>
  );
}
