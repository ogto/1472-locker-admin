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
      <p className="text-[13px] font-bold text-slate-500">{title}</p>
      <p className="mt-3 text-[28px] font-black tracking-[-0.03em] text-slate-900">
        {value}
      </p>
      <p className="mt-2 whitespace-pre-line text-[13px] text-slate-500">{helper}</p>
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
      <div className="space-y-4">
        <section>
          <div className="mb-3 px-1">
            <h3 className="text-base font-black text-slate-900">매출 요약</h3>
            <p className="mt-1 text-sm text-slate-500">결제, 취소, 기본요금, 추가요금 기준</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <SummaryCard
              title="기본요금"
              value={formatPrice(monthSummary.baseAmount ?? 0)}
              helper="기본 보관 결제 합계"
            />

            <SummaryCard
              title="추가요금"
              value={formatPrice(monthSummary.addAmount ?? 0)}
              helper={`추가요금 ${(monthSummary.addCount ?? 0).toLocaleString()}건`}
            />
            <SummaryCard
              title="총 결제액"
              value={formatPrice(monthSummary.totalPaymentAmount)}
              helper={`총 ${monthSummary.totalPaymentCount.toLocaleString()}건 결제`}
            />

            <SummaryCard
              title="총 취소액"
              value={formatPrice(monthSummary.totalCancelAmount)}
              helper={`총 ${monthSummary.totalCancelCount.toLocaleString()}건 취소`}
            />

            <SummaryCard
              title="순매출"
              value={formatPrice(monthSummary.totalAmount)}
              helper="총 결제액 - 총 취소액"
            />
          </div>
        </section>

        <section>
          <div className="mb-3 px-1">
            <h3 className="text-base font-black text-slate-900">보관 유형</h3>
            <p className="mt-1 text-sm text-slate-500">냉장 / 상온 / 케리어 건수</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <SummaryCard
              title="냉장"
              value={`${(monthSummary.coldCount ?? 0).toLocaleString()}건`}
              helper="냉장 보관 건수"
            />

            <SummaryCard
              title="상온"
              value={`${(monthSummary.roomCount ?? 0).toLocaleString()}건`}
              helper="상온 보관 건수"
            />

            <SummaryCard
              title="케리어"
              value={`${(monthSummary.carrierCount ?? 0).toLocaleString()}건`}
              helper="케리어 보관 건수"
            />
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section>
        <div className="mb-3 px-1">
          <h3 className="text-base font-black text-slate-900">당일 매출 요약</h3>
          <p className="mt-1 text-sm text-slate-500">결제, 취소, 기본요금, 추가요금 기준</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            title="기본요금"
            value={formatPrice(dailySummary.baseAmount ?? 0)}
            helper="기본 보관 결제 합계"
          />

          <SummaryCard
            title="추가요금"
            value={formatPrice(dailySummary.addAmount ?? 0)}
            helper={`추가요금 ${(dailySummary.addCount ?? 0).toLocaleString()}건`}
          />

          <SummaryCard
            title="당일 결제금액"
            value={formatPrice(dailySummary.paymentAmount)}
            helper={`결제 ${dailySummary.paymentCount.toLocaleString()}건`}
          />

          <SummaryCard
            title="당일 취소금액"
            value={formatPrice(dailySummary.refundAmount)}
            helper={`취소 ${dailySummary.refundCount.toLocaleString()}건`}
          />

          <SummaryCard
            title="당일 순매출"
            value={formatPrice(dailySummary.netAmount ?? (dailySummary.paymentAmount - dailySummary.refundAmount))}
            helper="결제금액 - 취소금액"
          />
        </div>
      </section>

      <section>
        <div className="mb-3 px-1">
          <h3 className="text-base font-black text-slate-900">당일 보관 유형</h3>
          <p className="mt-1 text-sm text-slate-500">냉장 / 상온 / 케리어 건수</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            title="냉장"
            value={`${(dailySummary.coldCount ?? 0).toLocaleString()}건`}
            helper="냉장 보관 건수"
          />

          <SummaryCard
            title="상온"
            value={`${(dailySummary.roomCount ?? 0).toLocaleString()}건`}
            helper="상온 보관 건수"
          />

          <SummaryCard
            title="케리어"
            value={`${(dailySummary.carrierCount ?? 0).toLocaleString()}건`}
            helper="케리어 보관 건수"
          />
        </div>
      </section>
    </div>
  );
}