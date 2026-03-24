import { formatPrice } from "@/lib/common";
import type { DailySalesViewRow, SalesPeriodType } from "@/lib/sales/types";

type Props = {
  rows: DailySalesViewRow[];
  periodType: SalesPeriodType;
};

function getRowTypeText(row: DailySalesViewRow) {
  const label = row.rowTypeLabel?.trim();
  if (label) return label;

  if (row.rowTypeCode === "0") return "결제";
  if (row.rowTypeCode === "1") return "환불";

  return "-";
}

function getPayTypeText(row: DailySalesViewRow) {
  const label = row.payTypeLabel?.trim();
  if (label) return label;

  if (row.payTypeCode === "0") return "앱";
  if (row.payTypeCode === "1") return "카드";
  if (row.payTypeCode === "2") return "현금";

  return "-";
}

function getPriceText(row: DailySalesViewRow) {
  const label = row.priceLabel?.trim();
  if (label) return label;

  return formatPrice(row.price ?? 0);
}

export function SalesDailyTable({ rows, periodType }: Props) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-black text-slate-900">
          {periodType === "month" ? "월 기준 원장 미리보기" : "일별 상세 리스트"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">결제 / 환불 내역 원장</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left text-sm font-black text-slate-500">
              <th className="px-3 py-2">예약번호</th>
              <th className="px-3 py-2">일시</th>
              <th className="px-3 py-2">구분</th>
              <th className="px-3 py-2">결제수단</th>
              <th className="px-3 py-2">금액</th>
              <th className="px-3 py-2">주문번호</th>
              <th className="px-3 py-2">지점</th>
              <th className="px-3 py-2">쿠폰</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-10 text-center text-sm font-medium text-slate-400"
                >
                  데이터가 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const rowTypeText = getRowTypeText(row);
                const payTypeText = getPayTypeText(row);
                const priceText = getPriceText(row);

                return (
                  <tr key={row.id} className="bg-slate-50 text-sm text-slate-700">
                    <td className="px-3 py-3">{row.storageId || "-"}</td>
                    <td className="whitespace-nowrap rounded-l-2xl px-3 py-3 font-semibold">
                      {row.createdAtLabel || "-"}
                    </td>

                    <td className="px-3 py-3">
                      <span
                        className={[
                          "inline-flex min-w-[58px] items-center justify-center rounded-full px-3 py-1 text-xs font-black",
                          row.rowTypeCode === "1"
                            ? "bg-rose-100 text-rose-600"
                            : "bg-emerald-100 text-emerald-600",
                        ].join(" ")}
                      >
                        {rowTypeText}
                      </span>
                    </td>

                    <td className="px-3 py-3 font-semibold">
                      {payTypeText}
                    </td>

                    <td className="px-3 py-3 font-black text-slate-900">
                      {priceText}
                    </td>

                    <td className="px-3 py-3">{row.ordId || "-"}</td>
                    <td className="px-3 py-3">{row.pointLabel || "-"}</td>
                    <td className="rounded-r-2xl px-3 py-3">
                      {row.couponPriceLabel || "0원"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}