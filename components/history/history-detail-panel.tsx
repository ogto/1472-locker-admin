import type { HistoryDetailItem } from "@/lib/history/types";
import {
  formatChannel,
  formatPrice,
  formatReservationDate,
  formatStatus,
  formatStorageType,
} from "@/lib/common";

type BadgeTone =
  | "slate"
  | "sky"
  | "amber"
  | "pink"
  | "emerald"
  | "rose"
  | "violet"
  | "fuchsia"
  | "cyan";

type Props = {
  loading: boolean;
  errorText: string;
  items: HistoryDetailItem[];
};

function Badge({
  text,
  tone,
}: {
  text: string;
  tone: BadgeTone;
}) {
  const toneClass =
    tone === "sky"
      ? "bg-sky-100 text-sky-700"
      : tone === "amber"
      ? "bg-amber-100 text-amber-700"
      : tone === "pink"
      ? "bg-pink-100 text-pink-700"
      : tone === "emerald"
      ? "bg-emerald-100 text-emerald-700"
      : tone === "rose"
      ? "bg-rose-100 text-rose-700"
      : tone === "violet"
      ? "bg-violet-100 text-violet-700"
      : tone === "fuchsia"
      ? "bg-fuchsia-100 text-fuchsia-700"
      : tone === "cyan"
      ? "bg-cyan-100 text-cyan-900"
      : "bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${toneClass}`}
    >
      {text}
    </span>
  );
}

function statusTone(statusLabel: string): BadgeTone {
  if (statusLabel === "보관중") return "emerald";
  if (statusLabel === "예약" || statusLabel === "찾기대기") return "cyan";
  if (statusLabel === "픽업" || statusLabel === "픽업완료") return "fuchsia";
  if (statusLabel === "취소") return "rose";
  return "slate";
}

function storageTypeTone(typeLabel: string): BadgeTone {
  if (typeLabel === "냉장") return "sky";
  if (typeLabel === "상온") return "amber";
  if (typeLabel === "케리어") return "violet";
  return "slate";
}

function pickupTone(pickupProduct?: boolean | null): BadgeTone {
  return pickupProduct ? "pink" : "slate";
}

function channelTone(osLabel: string): BadgeTone {
  if (osLabel === "키오스크") return "amber";
  if (osLabel === "앱") return "sky";
  return "slate";
}

function formatPoint(point?: string | null) {
  if (point === "bank") return "은행점";
  if (point === "sungsim") return "으능정이점";
  if (point === "baseball") return "한화생명볼파크점";
  return point || "-";
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  const raw = String(value).trim();
  if (!raw) return "-";

  const normalDate = new Date(raw);
  if (!Number.isNaN(normalDate.getTime())) {
    const yyyy = normalDate.getFullYear();
    const mm = String(normalDate.getMonth() + 1).padStart(2, "0");
    const dd = String(normalDate.getDate()).padStart(2, "0");
    const hh = String(normalDate.getHours()).padStart(2, "0");
    const mi = String(normalDate.getMinutes()).padStart(2, "0");
    const ss = String(normalDate.getSeconds()).padStart(2, "0");

    return `${yyyy}.${mm}.${dd} ${hh}:${mi}:${ss}`;
  }

  if (raw.includes(",")) {
    const parts = raw.split(",").map((v) => v.trim());

    if (parts.length >= 6) {
      const [year, month, day, hour, minute, second] = parts;

      const y = Number(year);
      const m = Number(month);
      const d = Number(day);
      const hh = Number(hour);
      const mi = Number(minute);
      const ss = Number(second);

      if (
        !Number.isNaN(y) &&
        !Number.isNaN(m) &&
        !Number.isNaN(d) &&
        !Number.isNaN(hh) &&
        !Number.isNaN(mi) &&
        !Number.isNaN(ss)
      ) {
        return `${String(y).padStart(4, "0")}.${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")} ${String(hh).padStart(2, "0")}:${String(mi).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
      }
    }
  }

  return raw;
}

function formatPickupLabel(pickupProduct?: boolean | null) {
  return pickupProduct ? "야구장픽업" : "일반보관";
}

export function HistoryDetailPanel({
  loading,
  errorText,
  items,
}: Props) {
  if (loading) {
    return (
      <div className="rounded-[24px] bg-slate-50 px-5 py-8 text-center text-sm font-bold text-slate-500">
        상세 내역을 불러오는 중입니다...
      </div>
    );
  }

  if (errorText) {
    return (
      <div className="rounded-[24px] bg-rose-50 px-5 py-8 text-center text-sm font-bold text-rose-600">
        {errorText}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[24px] bg-slate-50 px-5 py-8 text-center text-sm font-bold text-slate-500">
        상세 내역이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-[24px] bg-slate-50/90 p-4">
      {items.map((item) => {
        const typeLabel = formatStorageType(item.type);
        const statusLabel = formatStatus(item.reservationStatus);
        const pickupLabel = formatPickupLabel(item.pickupProduct);
        const osLabel = formatChannel(item.os);
        const reservationDateText = formatReservationDate(
          item.reservationDay,
          item.reservationStartTime
        );
        const updateAtText = formatDateTime(item.updateAt);
        const pointLabel = formatPoint(item.point);

        return (
          <section
            key={item.id}
            className="rounded-[24px] border border-white/70 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-base font-black text-slate-900">
                  <span>보관함 {item.storageId ?? "-"}</span>
                  <Badge text={typeLabel} tone={storageTypeTone(typeLabel)} />
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-500">
                  예약 #{item.reserveId} · 상세 ID {item.id}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge text={statusLabel} tone={statusTone(statusLabel)} />
                <Badge text={pickupLabel} tone={pickupTone(item.pickupProduct)} />
                <Badge text={osLabel} tone={channelTone(osLabel)} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3 xl:grid-cols-4">
              <div>
                <div className="text-xs font-black text-slate-400">보관일시</div>
                <div className="mt-1 text-sm font-black text-slate-900">
                  {reservationDateText}
                </div>
              </div>

              <div>
                <div className="text-xs font-black text-slate-400">종료시간</div>
                <div className="mt-1 text-sm font-black text-slate-900">
                  {updateAtText}
                </div>
              </div>

              <div>
                <div className="text-xs font-black text-slate-400">기본금액</div>
                <div className="mt-1 text-sm font-black text-slate-900">
                  {formatPrice(item.price)}
                </div>
              </div>

              <div>
                <div className="text-xs font-black text-slate-400">추가요금</div>
                <div className="mt-1 text-sm font-black text-slate-900">
                  {formatPrice(item.addPay)}
                </div>
              </div>

              <div>
                <div className="text-xs font-black text-slate-400">지점</div>
                <div className="mt-1 text-sm font-black text-slate-900">
                  {pointLabel}
                </div>
              </div>
            </div>

            {item.memo ? (
              <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3">
                <div className="text-xs font-black text-amber-700">메모</div>
                <div className="mt-1 text-sm font-bold text-amber-900">
                  {item.memo}
                </div>
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}