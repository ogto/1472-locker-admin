import type { DashboardSummary, ZoneKey } from "@/lib/dashboard/types";

type ReservationStatChipProps = {
  label: string;
  value: number;
  className: string;
  active?: boolean;
  onClick?: () => void;
};

function ReservationStatChip({
  label,
  value,
  className,
  active = false,
  onClick,
}: ReservationStatChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition-all duration-200",
        "border border-white/70",
        "hover:-translate-y-[1px] hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)] active:scale-[0.99]",
        className,
        active ? "shadow-[0_12px_28px_rgba(15,23,42,0.10)]" : "",
      ].join(" ")}
    >
      <span className="text-[13px] font-extrabold tracking-[-0.02em] opacity-80">
        {label}
      </span>
      <span className="text-[20px] font-black tracking-[-0.03em]">{value}</span>
    </button>
  );
}

function StorageStatChip({
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
        "flex items-center justify-between rounded-2xl px-4 py-3",
        "border border-white/70",
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
  const totalStorageCount = cold + room + carrier;

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <button
            type="button"
            onClick={() => onChangeFilter("all")}
            className={[
              "text-left transition-all duration-200 hover:-translate-y-[1px]",
              filter === "all"
                ? "rounded-2xl shadow-[0_12px_28px_rgba(15,23,42,0.10)]"
                : "",
            ].join(" ")}
          >
            <div className="text-[13px] font-extrabold tracking-[-0.02em] text-slate-500">
              보관중 예약
            </div>
            <div className="mt-1 flex items-end gap-2">
              <span className="text-[34px] font-black leading-none tracking-[-0.05em] text-slate-900 sm:text-[42px]">
                {activeReservations}
              </span>
              <span className="pb-1 text-[13px] font-bold text-slate-500 sm:text-[14px]">
                현재 진행중인 전체 예약
              </span>
            </div>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <ReservationStatChip
            label="앱 예약"
            value={app}
            className="bg-sky-100 text-sky-900"
            active={filter === "app"}
            onClick={() => onChangeFilter("app")}
          />
          <ReservationStatChip
            label="키오스크 예약"
            value={kiosk}
            className="bg-amber-100 text-amber-900"
            active={filter === "kiosk"}
            onClick={() => onChangeFilter("kiosk")}
          />
          <ReservationStatChip
            label="야구장픽업"
            value={pickup}
            className="bg-rose-100 text-rose-900"
            active={filter === "pickup"}
            onClick={() => onChangeFilter("pickup")}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[13px] font-extrabold tracking-[-0.02em] text-slate-500">
              현재 보관 칸 현황
            </div>
            <div className="mt-1 flex items-end gap-2">
              <span className="text-[34px] font-black leading-none tracking-[-0.05em] text-slate-900 sm:text-[42px]">
                {totalStorageCount}
              </span>
              <span className="pb-1 text-[13px] font-bold text-slate-500 sm:text-[14px]">
                총 보관 칸 수
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <StorageStatChip
            label="냉장"
            value={cold}
            className="bg-cyan-50 text-cyan-900"
          />
          <StorageStatChip
            label="상온"
            value={room}
            className="bg-emerald-50 text-emerald-900"
          />
          <StorageStatChip
            label="케리어"
            value={carrier}
            className="bg-violet-50 text-violet-900"
          />
        </div>
      </div>
    </section>
  );
}