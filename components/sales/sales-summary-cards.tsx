import { formatPrice } from "@/lib/common";
import type { DailySummary, MonthSummary, SalesPeriodType } from "@/lib/sales/types";

type Props = {
  periodType: SalesPeriodType;
  monthSummary: MonthSummary;
  dailySummary: DailySummary;
};

function SummaryCard({
  title,
  value,
  helper,
}: {
  title: string;
  value: string;
  helper: string;
}) {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-black tracking-[-0.03em] text-slate-900">
        {value}
      </p>
      <p className="mt-2 whitespace-pre-line text-sm text-slate-500">{helper}</p>
    </article>
  );
}

export function SalesSummaryCards({
  periodType,
  monthSummary,
  dailySummary,
}: Props) {
  if (periodType === "month") {
    return (
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="총 결제액"
          value={formatPrice(monthSummary.totalPaymentAmount)}
          helper={`총 ${monthSummary.totalPaymentCount.toLocaleString()}건 결제 완료`}
        />

        <SummaryCard
          title="총 취소액"
          value={formatPrice(monthSummary.totalCancelAmount)}
          helper={`총 ${monthSummary.totalCancelCount.toLocaleString()}건 취소 완료`}
        />

        <SummaryCard
          title="총 결제 건수"
          value={`${monthSummary.totalPaymentCount.toLocaleString()}건`}
          helper={`결제 ${monthSummary.totalPaymentCount.toLocaleString()}건 · 취소 ${monthSummary.totalCancelCount.toLocaleString()}건`}
        />

        <SummaryCard
          title="총 수익"
          value={formatPrice(monthSummary.totalAmount)}
          helper="총 결제액 - 총 취소액"
        />
      </section>
    );
  }

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        title="당일 결제금액"
        value={formatPrice(dailySummary.paymentAmount)}
        helper={`기본결제 + 추가결제 = ${dailySummary.paymentCount.toLocaleString()}건`}
      />

      <SummaryCard
        title="당일 취소금액"
        value={formatPrice(dailySummary.refundAmount)}
        helper={`취소 ${dailySummary.refundCount.toLocaleString()}건`}
      />

      <SummaryCard
        title="당일 결제 건수"
        value={`${dailySummary.paymentCount.toLocaleString()}건`}
        helper={`결제 ${dailySummary.paymentCount.toLocaleString()}건 · 취소 ${dailySummary.refundCount.toLocaleString()}건`}
      />

      <SummaryCard
        title="당일 수익"
        value={formatPrice(dailySummary.paymentAmount - dailySummary.refundAmount)}
        helper="결제금액 - 취소금액"
      />
    </section>
  );
}