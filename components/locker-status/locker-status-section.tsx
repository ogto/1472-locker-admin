"use client";

type LockerOccupantInfo = {
  name: string;
  tel: string;
  channel: string;
  reservationDate: string;
  status: string;
};

type LockerStatusSectionProps = {
  title: string;
  description: string;
  occupiedCount: number;
  totalCount: number;
  tone: "cold" | "room";
  lockers: number[];
  occupiedMap: Map<number, LockerOccupantInfo | null>;
  disabledSet: Set<number>;
  onLockerClick: (lockerNumber: number) => void;
};

function buildCellTone(disabled: boolean, occupied: boolean, tone: "cold" | "room") {
  if (disabled) {
    return "border-rose-300 bg-rose-100 text-rose-900 shadow-[0_10px_25px_rgba(244,63,94,0.16)]";
  }

  if (!occupied) {
    return "border-slate-200 bg-white text-slate-400";
  }

  if (tone === "cold") {
    return "border-sky-300 bg-sky-100 text-sky-900 shadow-[0_10px_25px_rgba(14,165,233,0.16)]";
  }

  return "border-amber-300 bg-amber-100 text-amber-900 shadow-[0_10px_25px_rgba(245,158,11,0.16)]";
}

export function LockerStatusSection({
  title,
  description,
  occupiedCount,
  totalCount,
  tone,
  lockers,
  occupiedMap,
  disabledSet,
  onLockerClick,
}: LockerStatusSectionProps) {
  const availableCount = totalCount - occupiedCount;
  const percent = totalCount === 0 ? 0 : Math.round((occupiedCount / totalCount) * 100);

  return (
    <section className="rounded-[32px] border border-white/70 bg-white/85 p-5 shadow-[0_20px_50px_rgba(148,163,184,0.12)] backdrop-blur sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-sm font-black uppercase tracking-[0.24em] text-slate-400">
            {title}
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
            {description}
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:min-w-[340px]">
          <MetricCard label="사용중" value={`${occupiedCount}`} accent={tone === "cold" ? "sky" : "amber"} />
          <MetricCard label="비어있음" value={`${availableCount}`} accent="slate" />
          <MetricCard label="점유율" value={`${percent}%`} accent="rose" />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3 text-xs font-bold">
        <LegendChip label="사용중" tone={tone} />
        <LegendChip label="사용불가" tone="disabled" />
        <LegendChip label="비어있음" tone="empty" />
      </div>

      <div className="mt-5 grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-10 2xl:grid-cols-12">
        {lockers.map((lockerNumber) => {
          const item = occupiedMap.get(lockerNumber);
          const disabled = disabledSet.has(lockerNumber);
          const occupied = Boolean(item);
          const statusText = disabled ? "사용불가" : occupied ? "사용중" : "비어있음";

          const titleText = item
            ? [
                `${lockerNumber}번 ${statusText}`,
                `고객: ${item.name || "-"}`,
                `연락처: ${item.tel || "-"}`,
                `채널: ${item.channel || "-"}`,
                `예약일시: ${item.reservationDate || "-"}`,
              ].join("\n")
            : `${lockerNumber}번 비어있음`;

          return (
            <button
              type="button"
              key={lockerNumber}
              title={titleText}
              onClick={() => onLockerClick(lockerNumber)}
              className={[
                "rounded-2xl border px-2 py-3 text-center transition hover:-translate-y-0.5",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300",
                buildCellTone(disabled, occupied, tone),
              ].join(" ")}
            >
              <div className="text-[11px] font-black tracking-tight sm:text-xs">
                {lockerNumber}
              </div>
              <div className="mt-1 text-[10px] font-bold sm:text-[11px]">
                {statusText}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "sky" | "amber" | "slate" | "rose";
}) {
  const accentClass =
    accent === "sky"
      ? "bg-sky-50 text-sky-700"
      : accent === "amber"
      ? "bg-amber-50 text-amber-700"
      : accent === "rose"
      ? "bg-rose-50 text-rose-700"
      : "bg-slate-100 text-slate-700";

  return (
    <div className={`rounded-2xl px-4 py-3 ${accentClass}`}>
      <div className="text-[11px] font-black uppercase tracking-[0.2em]">{label}</div>
      <div className="mt-1 text-2xl font-black tracking-tight">{value}</div>
    </div>
  );
}

function LegendChip({
  label,
  tone,
}: {
  label: string;
  tone: "cold" | "room" | "empty" | "disabled";
}) {
  const className =
    tone === "cold"
      ? "border-sky-200 bg-sky-50 text-sky-700"
      : tone === "room"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : tone === "disabled"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-slate-200 bg-slate-50 text-slate-500";

  return (
    <span className={`rounded-full border px-3 py-1.5 ${className}`}>
      {label}
    </span>
  );
}
