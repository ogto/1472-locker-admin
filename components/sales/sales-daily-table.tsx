"use client";

import { formatPrice } from "@/lib/common";
import type { DailySalesViewRow, SalesPeriodType } from "@/lib/sales/types";

type Props = {
  rows: DailySalesViewRow[];
  periodType: SalesPeriodType;
  onClickAddManual?: () => void;
};

function getRowTypeText(row: DailySalesViewRow) {
  const label = row.rowTypeLabel?.trim();
  if (label) return label;

  if (row.rowTypeCode === "0") return "기본결제";
  if (row.rowTypeCode === "1") return "추가결제";
  if (row.rowTypeCode === "2") return "취소";

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

function getBadgeClass(code: string) {
  if (code === "2") return "bg-rose-100 text-rose-600";
  if (code === "1") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-600";
}

export function SalesDailyTable({
  rows,
  periodType,
  onClickAddManual,
}: Props) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[26px] font-black tracking-[-0.03em] text-slate-900 sm:text-lg">
            {periodType === "month" ? "월 기준 원장 미리보기" : "일별 상세 리스트"}
          </h2>
          <p className="mt-1 text-[15px] font-semibold text-slate-500 sm:text-sm">
            기본결제 / 추가결제 / 취소 내역
          </p>
        </div>

        {periodType === "daily" ? (
          <button
            type="button"
            onClick={onClickAddManual}
            className="inline-flex items-center justify-center rounded-[22px] bg-slate-900 px-5 py-4 text-[17px] font-black text-white transition hover:bg-slate-800 active:scale-[0.99] sm:px-4 sm:py-2.5 sm:text-sm"
          >
            수동 매출 추가
          </button>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-200 px-4 py-12 text-center text-[15px] font-semibold text-slate-400">
          데이터가 없습니다.
        </div>
      ) : (
        <>
          {/* 모바일 카드형 */}
          <div className="space-y-3 sm:hidden">
            {rows.map((row) => {
              const rowTypeText = getRowTypeText(row);
              const payTypeText = getPayTypeText(row);
              const priceText = getPriceText(row);

              return (
                <article
                  key={row.id}
                  className="rounded-[24px] bg-slate-50 p-4 shadow-[inset_0_0_0_1px_rgba(226,232,240,0.7)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[17px] font-black text-slate-900">
                        {priceText}
                      </div>
                      <div className="mt-1 text-[14px] font-semibold text-slate-500">
                        {row.createdAtLabel || "-"}
                      </div>
                    </div>

                    <span
                      className={[
                        "inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[13px] font-black",
                        getBadgeClass(row.rowTypeCode),
                      ].join(" ")}
                    >
                      {rowTypeText}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white px-3 py-3">
                      <div className="text-[12px] font-bold text-slate-400">
                        결제수단
                      </div>
                      <div className="mt-1 text-[15px] font-black text-slate-800">
                        {payTypeText}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white px-3 py-3">
                      <div className="text-[12px] font-bold text-slate-400">
                        지점
                      </div>
                      <div className="mt-1 text-[15px] font-black text-slate-800">
                        {row.pointLabel || "-"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-2xl bg-white px-3 py-3">
                    <div className="text-[12px] font-bold text-slate-400">메모</div>
                    <div className="mt-1 break-words text-[14px] font-semibold leading-6 text-slate-700">
                      {row.memo || "-"}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* 데스크탑 테이블형 */}
          <div className="hidden overflow-x-auto sm:block">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-sm font-black text-slate-500">
                  <th className="px-3 py-2">일시</th>
                  <th className="px-3 py-2">구분</th>
                  <th className="px-3 py-2">결제수단</th>
                  <th className="px-3 py-2">금액</th>
                  <th className="px-3 py-2">지점</th>
                  <th className="px-3 py-2">메모</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => {
                  const rowTypeText = getRowTypeText(row);
                  const payTypeText = getPayTypeText(row);
                  const priceText = getPriceText(row);

                  return (
                    <tr key={row.id} className="bg-slate-50 text-sm text-slate-700">
                      <td className="whitespace-nowrap rounded-l-2xl px-3 py-3 font-semibold">
                        {row.createdAtLabel || "-"}
                      </td>

                      <td className="px-3 py-3">
                        <span
                          className={[
                            "inline-flex min-w-[58px] items-center justify-center rounded-full px-3 py-1 text-xs font-black",
                            getBadgeClass(row.rowTypeCode),
                          ].join(" ")}
                        >
                          {rowTypeText}
                        </span>
                      </td>

                      <td className="px-3 py-3 font-semibold">{payTypeText}</td>

                      <td className="px-3 py-3 font-black text-slate-900">
                        {priceText}
                      </td>

                      <td className="px-3 py-3">{row.pointLabel || "-"}</td>

                      <td className="rounded-r-2xl px-3 py-3">{row.memo || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}