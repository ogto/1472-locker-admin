import type { HistorySummary } from "@/lib/history/types";

type CardProps = {
  title: string;
  value: number;
  className: string;
};

function SummaryCard({ title, value, className }: CardProps) {
  return (
    <div className={`rounded-[28px] p-5 shadow-sm ${className}`}>
      <div className="text-base font-bold opacity-90">{title}</div>
      <div className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
        {value}
      </div>
    </div>
  );
}

export function HistorySummaryCards({
  total,
  app,
  kiosk,
  pickup,
}: HistorySummary) {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <SummaryCard
        title="전체 건수"
        value={total}
        className="bg-slate-900 text-white"
      />
      <SummaryCard
        title="앱"
        value={app}
        className="bg-sky-100 text-sky-900"
      />
      <SummaryCard
        title="키오스크"
        value={kiosk}
        className="bg-amber-100 text-amber-900"
      />
      <SummaryCard
        title="픽업"
        value={pickup}
        className="bg-pink-100 text-pink-900"
      />
    </div>
  );
}