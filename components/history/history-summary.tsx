import type { HistorySummary } from "@/lib/history/types";

function SummaryStatChip({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div
      className={[
        "flex items-center justify-between rounded-2xl border border-white/70 px-4 py-3",
        className,
      ].join(" ")}
    >
      <span className="text-[13px] font-extrabold tracking-[-0.02em] opacity-80">
        {label}
      </span>
      <span className="text-[20px] font-black tracking-[-0.03em]">{value}</span>
    </div>
  );
}

function SummaryStatWithCancelChip({
  label,
  value,
  canceledValue,
  className,
}: {
  label: string;
  value: number;
  canceledValue: number;
  className: string;
}) {
  return (
    <div
      className={[
        "rounded-2xl border border-white/70 px-4 py-3",
        className,
      ].join(" ")}
    >
      <div className="text-[13px] font-extrabold tracking-[-0.02em] opacity-80">
        {label}
      </div>

      <div className="mt-2 text-right text-[18px] font-black tracking-[-0.03em]">
        <span className="text-[12px] font-bold opacity-70">전체</span>
        <span className="ml-1">{value}</span>
        <span className="mx-2 opacity-40">|</span>
        <span className="text-[12px] font-bold opacity-70">취소</span>
        <span className="ml-1">{canceledValue}</span>
      </div>
    </div>
  );
}

export function HistorySummaryCards({
  reservationCount,
  storageCount,
  coldCount,
  roomCount,
  carrierCount,
  pickupCount,
  coldCanceledCount,
  roomCanceledCount,
  carrierCanceledCount,
  pickupCanceledCount,
  completedCount,
  pickupDoneCount,
  pendingCount,
  canceledCount,
}: HistorySummary) {
  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[13px] font-extrabold tracking-[-0.02em] text-slate-500">
              예약 상태 요약
            </div>
            <div className="mt-1 flex items-end gap-2">
              <span className="text-[34px] font-black leading-none tracking-[-0.05em] text-slate-900 sm:text-[42px]">
                {reservationCount}
              </span>
              <span className="pb-1 text-[13px] font-bold text-slate-500 sm:text-[14px]">
                전체 예약 인원 수
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 px-3 py-2 text-[12px] font-bold text-slate-500">
            보관중 · 픽업완료 · 예약 · 취소 기준
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryStatChip
            label="보관중(명)"
            value={completedCount}
            className="bg-emerald-100 text-emerald-900"
          />
          <SummaryStatChip
            label="픽업완료(명)"
            value={pickupDoneCount}
            className="bg-fuchsia-100 text-fuchsia-900"
          />
          <SummaryStatChip
            label="예약"
            value={pendingCount}
            className="bg-cyan-100 text-cyan-900"
          />
          <SummaryStatChip
            label="취소"
            value={canceledCount}
            className="bg-rose-100 text-rose-900"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[13px] font-extrabold tracking-[-0.02em] text-slate-500">
              보관함 이용 요약
            </div>
            <div className="mt-1 flex items-end gap-2">
              <span className="text-[34px] font-black leading-none tracking-[-0.05em] text-slate-900 sm:text-[42px]">
                {storageCount}
              </span>
              <span className="pb-1 text-[13px] font-bold text-slate-500 sm:text-[14px]">
                전체 보관함 건수
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 px-3 py-2 text-[12px] font-bold text-slate-500">
            전체 건수와 취소 건수 기준
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryStatWithCancelChip
            label="냉장 건수"
            value={coldCount}
            canceledValue={coldCanceledCount}
            className="bg-sky-100 text-sky-900"
          />
          <SummaryStatWithCancelChip
            label="상온 건수"
            value={roomCount}
            canceledValue={roomCanceledCount}
            className="bg-amber-100 text-amber-900"
          />
          <SummaryStatWithCancelChip
            label="케리어 건수"
            value={carrierCount}
            canceledValue={carrierCanceledCount}
            className="bg-violet-100 text-violet-900"
          />
          <SummaryStatWithCancelChip
            label="야구장픽업 건수"
            value={pickupCount}
            canceledValue={pickupCanceledCount}
            className="bg-pink-100 text-pink-900"
          />
        </div>
      </section>
    </div>
  );
}