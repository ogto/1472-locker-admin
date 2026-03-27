import type { HistorySummary } from "@/lib/history/types";

type CardProps = {
  title: string;
  value: number;
  className: string;
  accentClassName: string;
};

function SummaryCard({
  title,
  value,
  className,
  accentClassName,
}: CardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-[30px] border border-white/70 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur ${className}`}
    >
      <div
        className={`absolute -right-5 -top-5 h-20 w-20 rounded-full opacity-20 blur-2xl ${accentClassName}`}
      />
      <div className="relative z-10">
        <div className="text-sm font-extrabold tracking-[-0.02em] opacity-80 sm:text-[15px]">
          {title}
        </div>
        <div className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-4xl xl:text-[42px]">
          {value}
        </div>
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
  completedCount,
  pickupDoneCount,
  pendingCount,
  canceledCount,
}: HistorySummary) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <SummaryCard
          title="예약건수(명)"
          value={reservationCount}
          className="bg-slate-900 text-white"
          accentClassName="bg-white"
        />
                <SummaryCard
          title="보관중(명)"
          value={completedCount}
          className="bg-emerald-100 text-emerald-900"
          accentClassName="bg-emerald-500"
        />
        <SummaryCard
          title="픽업완료(명)"
          value={pickupDoneCount}
          className="bg-fuchsia-100 text-fuchsia-900"
          accentClassName="bg-fuchsia-500"
        />
        <SummaryCard
          title="예약"
          value={pendingCount}
          className="bg-cyan-100 text-cyan-900"
          accentClassName="bg-cyan-500"
        />
        <SummaryCard
          title="취소"
          value={canceledCount}
          className="bg-rose-100 text-rose-900"
          accentClassName="bg-rose-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <SummaryCard
          title="보관함 건수"
          value={storageCount}
          className="bg-indigo-100 text-indigo-900"
          accentClassName="bg-indigo-500"
        />
        <SummaryCard
          title="냉장 건수"
          value={coldCount}
          className="bg-sky-100 text-sky-900"
          accentClassName="bg-sky-500"
        />
        <SummaryCard
          title="상온 건수"
          value={roomCount}
          className="bg-amber-100 text-amber-900"
          accentClassName="bg-amber-500"
        />
        <SummaryCard
          title="케리어 건수"
          value={carrierCount}
          className="bg-violet-100 text-violet-900"
          accentClassName="bg-violet-500"
        />
        <SummaryCard
          title="픽업보관 건수"
          value={pickupCount}
          className="bg-pink-100 text-pink-900"
          accentClassName="bg-pink-500"
        />
      </div>
    </div>
  );
}