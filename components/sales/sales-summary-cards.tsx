import { formatPrice } from "@/lib/common";
import type {
  DailySalesViewRow,
  DailySummary,
  MonthSummary,
  SalesPeriodType,
} from "@/lib/sales/types";

type Props = {
  periodType: SalesPeriodType;
  monthSummary: MonthSummary;
  dailySummary: DailySummary;
  dailyRows: DailySalesViewRow[];
  dailyDate?: string;
  onClickDailyRefund?: () => void;
};

type CardCompanySummary = {
  brand: string;
  creditCount: number;
  creditAmount: number;
  checkCount: number;
  checkAmount: number;
  totalCount: number;
  totalAmount: number;
};

const CARD_BRAND_PATTERNS = [
  { brand: "KB국민", patterns: ["KB국민", "국민"] },
  { brand: "NH농협", patterns: ["NH농협", "농협", "NH"] },
  { brand: "카카오뱅크", patterns: ["카카오뱅크", "카카오"] },
  { brand: "토스뱅크", patterns: ["토스뱅크", "토스"] },
  { brand: "케이뱅크", patterns: ["케이뱅크", "K뱅크", "케이"] },
  { brand: "새마을금고", patterns: ["새마을금고", "MG"] },
  { brand: "IBK기업", patterns: ["IBK기업", "기업", "IBK"] },
  { brand: "신한", patterns: ["신한"] },
  { brand: "삼성", patterns: ["삼성"] },
  { brand: "우리", patterns: ["우리"] },
  { brand: "현대", patterns: ["현대"] },
  { brand: "하나", patterns: ["하나"] },
  { brand: "롯데", patterns: ["롯데"] },
  { brand: "BC", patterns: ["비씨", "BC"] },
] as const;

function SummaryCard({
  title,
  value,
  helper,
  onClick,
}: {
  title: string;
  value: string;
  helper: string;
  onClick?: () => void;
}) {
  const className = [
    "rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm",
    onClick
      ? "transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md"
      : "",
  ].join(" ");

  const content = (
    <>
      <p className="text-[12px] font-bold text-slate-500">{title}</p>
      <p className="mt-3 text-[26px] font-black tracking-[-0.03em] text-slate-900">
        {value}
      </p>
      <p className="mt-2 whitespace-pre-line text-[12px] text-slate-500">
        {helper}
      </p>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  return <article className={className}>{content}</article>;
}

function normalizeCardCompany(value: string) {
  const raw = value.trim();

  if (!raw) {
    return {
      brand: "카드사 미확인",
      cardType: "credit" as const,
    };
  }

  const compact = raw.replace(/[\s\-_]/g, "").toUpperCase();
  const matchedBrand = CARD_BRAND_PATTERNS.find(({ patterns }) =>
    patterns.some((pattern) =>
      compact.includes(pattern.replace(/[\s\-_]/g, "").toUpperCase()),
    ),
  );

  const fallbackBrand =
    raw.replace(/카드|체크|신용|마스타|마스터/g, "").trim() ||
    "카드사 미확인";

  return {
    brand: matchedBrand?.brand ?? fallbackBrand,
    cardType: compact.includes("체크") ? ("check" as const) : ("credit" as const),
  };
}

function buildCardCompanySummary(rows: DailySalesViewRow[]) {
  const summaries = new Map<string, CardCompanySummary>();

  rows
    .filter((row) => row.payTypeCode === "1" && row.rowTypeCode !== "2")
    .forEach((row) => {
      const { brand, cardType } = normalizeCardCompany(row.cardCompany);
      const current = summaries.get(brand) ?? {
        brand,
        creditCount: 0,
        creditAmount: 0,
        checkCount: 0,
        checkAmount: 0,
        totalCount: 0,
        totalAmount: 0,
      };
      const price = Number(row.price || 0);

      if (cardType === "check") {
        current.checkCount += 1;
        current.checkAmount += price;
      } else {
        current.creditCount += 1;
        current.creditAmount += price;
      }

      current.totalCount += 1;
      current.totalAmount += price;
      summaries.set(brand, current);
    });

  return [...summaries.values()].sort((a, b) => {
    if (b.totalAmount !== a.totalAmount) return b.totalAmount - a.totalAmount;
    return b.totalCount - a.totalCount;
  });
}

function formatCountAmount(count: number, amount: number) {
  if (!count) return "-";
  return `${count.toLocaleString()}건 / ${formatPrice(amount)}`;
}

async function downloadCardCompanySummaryExcel(
  summaries: CardCompanySummary[],
  date?: string,
) {
  const response = await fetch("/api/sales/card-company-summary/excel", {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ date, summaries }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "엑셀 파일을 생성하지 못했습니다.");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `card-company-summary-${date || "daily"}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function CardCompanySummaryTable({
  rows,
  date,
}: {
  rows: DailySalesViewRow[];
  date?: string;
}) {
  const summaries = buildCardCompanySummary(rows);
  const totalCount = summaries.reduce((acc, cur) => acc + cur.totalCount, 0);
  const totalAmount = summaries.reduce((acc, cur) => acc + cur.totalAmount, 0);

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-base font-black text-slate-900">카드사별 통계</h3>
          <p className="mt-1 text-sm text-slate-500">
            브랜드 기준 신용 / 체크 건수와 금액
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <div className="text-sm font-black text-slate-700">
            총 {totalCount.toLocaleString()}건 · {formatPrice(totalAmount)}
          </div>

          <button
            type="button"
            onClick={() => {
              void downloadCardCompanySummaryExcel(summaries, date).catch(
                (error) => {
                  alert(
                    error instanceof Error
                      ? error.message
                      : "엑셀 파일을 생성하지 못했습니다.",
                  );
                },
              );
            }}
            disabled={summaries.length === 0}
            className="inline-flex min-h-[38px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            엑셀 다운로드
          </button>
        </div>
      </div>

      {summaries.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-slate-200 px-4 py-8 text-center text-sm font-bold text-slate-400">
          카드 결제 내역이 없습니다.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-sm font-black text-slate-500">
                <th className="px-3 py-2">브랜드</th>
                <th className="px-3 py-2 text-right">신용</th>
                <th className="px-3 py-2 text-right">체크</th>
                <th className="px-3 py-2 text-right">합계</th>
              </tr>
            </thead>

            <tbody>
              {summaries.map((summary) => (
                <tr
                  key={summary.brand}
                  className="bg-slate-50 text-sm text-slate-700"
                >
                  <td className="rounded-l-2xl px-3 py-3 font-black text-slate-900">
                    {summary.brand}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold">
                    {formatCountAmount(summary.creditCount, summary.creditAmount)}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold">
                    {formatCountAmount(summary.checkCount, summary.checkAmount)}
                  </td>
                  <td className="rounded-r-2xl px-3 py-3 text-right font-black text-slate-900">
                    {formatCountAmount(summary.totalCount, summary.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function SalesSummaryCards({
  periodType,
  monthSummary,
  dailySummary,
  dailyRows,
  dailyDate,
  onClickDailyRefund,
}: Props) {
  if (periodType === "month") {
    return (
      <div className="space-y-4">
        <section>
          <div className="mb-3 px-1">
            <h3 className="text-base font-black text-slate-900">매출 요약</h3>
            <p className="mt-1 text-sm text-slate-500">
              결제, 취소, 기본요금, 추가요금 기준
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <SummaryCard
              title="총 결제금액"
              value={formatPrice(monthSummary.totalPaymentAmount)}
              helper={`총 ${monthSummary.totalPaymentCount.toLocaleString()}건 결제`}
            />

            <SummaryCard
              title="기본요금"
              value={formatPrice(monthSummary.baseAmount ?? 0)}
              helper={`기본요금 ${(monthSummary.baseCount ?? 0).toLocaleString()}건`}
            />

            <SummaryCard
              title="추가요금"
              value={formatPrice(monthSummary.addAmount ?? 0)}
              helper={`추가요금 ${(monthSummary.addCount ?? 0).toLocaleString()}건`}
            />

            <SummaryCard
              title="총 취소금액"
              value={formatPrice(monthSummary.totalCancelAmount)}
              helper={`총 ${monthSummary.totalCancelCount.toLocaleString()}건 취소`}
            />

            <SummaryCard
              title="순매출"
              value={formatPrice(monthSummary.totalAmount)}
              helper="총 결제금액 - 총 취소금액"
            />
          </div>
        </section>

        <section>
          <div className="mb-3 px-1">
            <h3 className="text-base font-black text-slate-900">보관 유형</h3>
            <p className="mt-1 text-sm text-slate-500">
              냉장 / 상온 / 캐리어 건수
            </p>
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
              title="캐리어"
              value={`${(monthSummary.carrierCount ?? 0).toLocaleString()}건`}
              helper="캐리어 보관 건수"
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
          <h3 className="text-base font-black text-slate-900">
            당일 매출 요약
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            결제, 취소, 기본요금, 추가요금 기준
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            title="당일 결제금액"
            value={formatPrice(dailySummary.paymentAmount)}
            helper={`결제 ${dailySummary.paymentCount.toLocaleString()}건`}
          />

          <SummaryCard
            title="기본요금"
            value={formatPrice(dailySummary.baseAmount ?? 0)}
            helper={`기본요금 ${(dailySummary.baseCount ?? 0).toLocaleString()}건`}
          />

          <SummaryCard
            title="추가요금"
            value={formatPrice(dailySummary.addAmount ?? 0)}
            helper={`추가요금 ${(dailySummary.addCount ?? 0).toLocaleString()}건`}
          />

          <SummaryCard
            title="당일 취소금액"
            value={formatPrice(dailySummary.refundAmount)}
            helper={`취소 ${dailySummary.refundCount.toLocaleString()}건`}
            onClick={onClickDailyRefund}
          />

          <SummaryCard
            title="당일 순매출"
            value={formatPrice(
              dailySummary.netAmount ??
                dailySummary.paymentAmount - dailySummary.refundAmount,
            )}
            helper="결제금액 - 취소금액"
          />
        </div>
      </section>

      <section>
        <div className="mb-3 px-1">
          <h3 className="text-base font-black text-slate-900">
            당일 보관 유형
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            냉장 / 상온 / 캐리어 건수
          </p>
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
            title="캐리어"
            value={`${(dailySummary.carrierCount ?? 0).toLocaleString()}건`}
            helper="캐리어 보관 건수"
          />
        </div>
      </section>

      <CardCompanySummaryTable rows={dailyRows} date={dailyDate} />
    </div>
  );
}
