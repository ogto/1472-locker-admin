"use client";

import type { ManualSalesViewRow } from "@/lib/sales/types";

type Props = {
  rows: ManualSalesViewRow[];
  loading?: boolean;
  onClickAdd: () => void;
};

export function ManualSalesTable({
  rows,
  loading = false,
  onClickAdd,
}: Props) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-white/70 bg-white/90 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <div className="text-[18px] font-black tracking-[-0.03em] text-slate-900">
            수동 매출 리스트
          </div>
          <div className="mt-1 text-[13px] font-semibold text-slate-500">
            카드·현금 / 메모 있는 기본결제만 표시
          </div>
        </div>

        <button
          type="button"
          onClick={onClickAdd}
          className="rounded-[18px] bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
        >
          수동 매출 추가
        </button>
      </div>

      {loading ? (
        <div className="px-5 py-10 text-center text-sm font-bold text-slate-500">
          불러오는 중...
        </div>
      ) : rows.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm font-bold text-slate-500">
          표시할 수동 매출이 없습니다.
        </div>
      ) : (
        <>
          <div className="hidden grid-cols-[140px_120px_120px_1fr] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[13px] font-black text-slate-500 md:grid">
            <div>등록시각</div>
            <div>금액</div>
            <div>결제수단</div>
            <div>메모</div>
          </div>

          <div className="divide-y divide-slate-100">
            {rows.map((row) => (
              <div
                key={row.id}
                className="grid gap-3 px-4 py-4 md:grid-cols-[140px_120px_120px_1fr] md:items-center md:gap-4 md:px-5"
              >
                <div>
                  <div className="text-[12px] font-bold text-slate-400 md:hidden">
                    등록시각
                  </div>
                  <div className="text-[14px] font-bold text-slate-700">
                    {row.createdAtLabel}
                  </div>
                </div>

                <div>
                  <div className="text-[12px] font-bold text-slate-400 md:hidden">
                    금액
                  </div>
                  <div className="text-[15px] font-black text-slate-900">
                    {row.priceLabel}
                  </div>
                </div>

                <div>
                  <div className="text-[12px] font-bold text-slate-400 md:hidden">
                    결제수단
                  </div>
                  <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[13px] font-black text-slate-700">
                    {row.payTypeLabel}
                  </div>
                </div>

                <div>
                  <div className="text-[12px] font-bold text-slate-400 md:hidden">
                    메모
                  </div>
                  <div className="text-[14px] font-semibold leading-6 text-slate-700">
                    {row.memo}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}