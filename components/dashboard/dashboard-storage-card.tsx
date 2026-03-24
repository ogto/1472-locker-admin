import {
  formatChannel,
  formatPrice,
  formatReservationDate,
  formatStatus,
} from "@/lib/common";
import type { DashboardItem } from "@/lib/dashboard/types";

type Props = {
  item: DashboardItem;
  onClick: () => void;
};

function InfoBlock({
  label,
  value,
  valueClassName = "",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/95 px-4 py-3 shadow-sm">
      <div className="text-[11px] font-extrabold tracking-[0.02em] text-slate-400">
        {label}
      </div>
      <div
        className={[
          "mt-1 break-all text-[15px] font-black tracking-[-0.02em] text-slate-900",
          valueClassName,
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}

function getStatusTone(status: string) {
  if (status.includes("이용중") || status.includes("보관중")) {
    return "bg-emerald-50 text-emerald-700 border border-emerald-100";
  }

  if (status.includes("대기") || status.includes("예약")) {
    return "bg-amber-50 text-amber-700 border border-amber-100";
  }

  return "bg-rose-50 text-rose-700 border border-rose-100";
}

function getChannelTone(channel: string) {
  return channel === "키오스크"
    ? "bg-violet-50 text-violet-700 border border-violet-100"
    : "bg-sky-50 text-sky-700 border border-sky-100";
}

export function DashboardStorageCard({ item, onClick }: Props) {
  const statusText = formatStatus(item.reservationStatus);
  const channelText = formatChannel(item.os);

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group w-full overflow-hidden rounded-[30px] border border-rose-100/80 p-5 text-left transition-all duration-200",
        "bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(255,247,249,0.96)_100%)]",
        "shadow-[0_12px_34px_rgba(15,23,42,0.06)]",
        "hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(251,113,133,0.15)]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="max-w-full truncate text-[24px] font-black tracking-[-0.03em] text-slate-900">
              {item.customerName}
            </div>

            <div
              className={[
                "inline-flex items-center rounded-full px-3 py-1 text-xs font-black",
                getChannelTone(channelText),
              ].join(" ")}
            >
              {channelText}
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500">
            <span className="rounded-full bg-rose-50 px-3 py-1 text-rose-600">
              예약번호 {item.reserveId ?? "-"}
            </span>
          </div>
        </div>

        <div
          className={[
            "shrink-0 rounded-full px-3 py-2 text-xs font-black",
            getStatusTone(statusText),
          ].join(" ")}
        >
          {statusText}
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="rounded-2xl bg-gradient-to-r from-rose-50 via-orange-50 to-amber-50 px-4 py-4">
          <div className="text-[11px] font-extrabold tracking-[0.02em] text-slate-500">
            시작
          </div>
          <div className="mt-1 text-[17px] font-black tracking-[-0.02em] text-slate-900">
            {formatReservationDate(
              item.reservationDay,
              item.reservationStartTime
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <InfoBlock label="이용시간" value={`${item.reservationTime}분`} />
          <InfoBlock label="채널" value={channelText} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <InfoBlock
            label="비밀번호"
            value={item.password}
            valueClassName="tracking-[0.22em]"
          />
          <InfoBlock
            label="결제금액"
            value={formatPrice(item.price + item.addPay)}
          />
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-rose-100 bg-white/90 px-4 py-3">
          <div className="text-sm font-extrabold text-slate-700">
            자세히 보기
          </div>
          <div className="text-lg transition-transform duration-200 group-hover:translate-x-1">
            →
          </div>
        </div>
      </div>
    </button>
  );
}