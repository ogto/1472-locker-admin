import type { DashboardSummary, ZoneKey } from "@/lib/dashboard/types";

type CardProps = {
  title: string;
  value: number;
  helper: string;
  className: string;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
};

function SummaryCard({
  title,
  value,
  helper,
  className,
  active = false,
  onClick,
  disabled = false,
}: CardProps) {
  const clickable = !!onClick && !disabled;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "w-full rounded-[28px] p-5 text-left shadow-sm transition-all duration-200",
        clickable ? "hover:-translate-y-0.5 hover:shadow-md" : "cursor-default",
        active ? "ring-4 ring-rose-200" : "",
        disabled ? "opacity-95" : "",
        className,
      ].join(" ")}
    >
      <div className="text-[13px] font-bold opacity-90">{title}</div>
      <div className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
        {value}
      </div>
      <div className="mt-2 text-[12px] opacity-80">{helper}</div>
    </button>
  );
}

type Props = DashboardSummary & {
  filter: ZoneKey;
  onChangeFilter: (value: ZoneKey) => void;
};

export function DashboardSummaryCards({
  activeReservations,
  app,
  kiosk,
  pickup,
  cold,
  room,
  carrier,
  filter,
  onChangeFilter,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard
          title="보관중 예약"
          value={activeReservations}
          helper="전체 진행중 예약 건수"
          className="bg-slate-900 text-white"
          active={filter === "all"}
          onClick={() => onChangeFilter("all")}
        />
        <SummaryCard
          title="앱 예약"
          value={app}
          helper="앱으로 접수된 예약 건수"
          className="bg-sky-100 text-sky-900"
          active={filter === "app"}
          onClick={() => onChangeFilter("app")}
        />
        <SummaryCard
          title="키오스크 예약"
          value={kiosk}
          helper="키오스크 접수 예약 건수"
          className="bg-amber-100 text-amber-900"
          active={filter === "kiosk"}
          onClick={() => onChangeFilter("kiosk")}
        />
        <SummaryCard
          title="픽업보관"
          value={pickup}
          helper="픽업 상품 포함 예약 건수"
          className="bg-rose-100 text-rose-900"
          active={filter === "pickup"}
          onClick={() => onChangeFilter("pickup")}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <SummaryCard
          title="냉장"
          value={cold}
          helper="현재 보관중인 냉장 칸 수"
          className="bg-cyan-100 text-cyan-900"
          disabled
        />
        <SummaryCard
          title="상온"
          value={room}
          helper="현재 보관중인 상온 칸 수"
          className="bg-emerald-100 text-emerald-900"
          disabled
        />
        <SummaryCard
          title="케리어"
          value={carrier}
          helper="현재 보관중인 케리어 칸 수"
          className="bg-violet-100 text-violet-900"
          disabled
        />
      </div>
    </div>
  );
}