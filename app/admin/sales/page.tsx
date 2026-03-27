"use client";

import { useMemo, useState } from "react";
import { LoginCard } from "@/components/auth/login-card";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminShell } from "@/components/admin/admin-shell";
import { StatusBanner } from "@/components/admin/status-banner";
import { SalesDailyTable } from "@/components/sales/sales-daily-table";
import { SalesFilters } from "@/components/sales/sales-filters";
import { SalesMonthChart } from "@/components/sales/sales-month-chart";
import { SalesPaymentChart } from "@/components/sales/sales-payment-chart";
import { SalesSummaryCards } from "@/components/sales/sales-summary-cards";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useSales } from "@/hooks/use-sales";
import type { PointKey, SalesPeriodType } from "@/lib/sales/types";

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
  const [point, setPoint] = useState<PointKey>("bank");
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [date, setDate] = useState(getTodayDateString());

  const { data, loading, error, refetch } = useSales({
    periodType,
    year,
    month,
    date,
    point,
  });

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
          point={point}
          year={year}
          month={month}
          date={date}
          loading={loading}
          onChangePeriodType={setPeriodType}
          onChangePoint={setPoint}
          onChangeYear={setYear}
          onChangeMonth={setMonth}
          onChangeDate={setDate}
          onRefresh={refetch}
        />

        {error ? <StatusBanner type="error" text={error} /> : null}

        {!data ? (
          <section className="rounded-[28px] border border-slate-200 bg-white px-5 py-10 text-center text-sm font-medium text-slate-500 shadow-sm">
            {loading ? "데이터를 불러오는 중입니다." : "표시할 데이터가 없습니다."}
          </section>
        ) : (
          <>
            <SalesSummaryCards
              periodType={periodType}
              monthSummary={data.monthSummary}
              dailySummary={data.dailySummary}
            />

            {periodType === "month" ? (
              <div className="grid gap-5 xl:grid-cols-2">
                <SalesMonthChart rows={data.monthRows} />
                <SalesPaymentChart rows={data.paymentRows} />
              </div>
            ) : (
              <SalesDailyTable rows={data.dailyRows} periodType={periodType} />
            )}
          </>
        )}
      </div>
    </AdminShell>
  );
}