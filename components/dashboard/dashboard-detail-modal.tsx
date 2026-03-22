"use client";

import {
  formatReservationDate,
  formatStatus,
  formatStorageType,
  groupDetailByType,
} from "@/lib/dashboard/mapper";
import type { ReserveUserDetailItem } from "@/lib/dashboard/types";

type Props = {
  open: boolean;
  loading: boolean;
  errorText: string;
  data: ReserveUserDetailItem[];
  onClose: () => void;
};

export function DashboardDetailModal({
  open,
  loading,
  errorText,
  data,
  onClose,
}: Props) {
  if (!open) return null;

  const first = data[0];
  const grouped = groupDetailByType(data);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.46)] p-4 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[32px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(255,247,249,0.96)_100%)] shadow-[0_24px_80px_rgba(15,23,42,0.22)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-rose-100 px-5 py-5 sm:px-6">
          <div>
            <div className="text-[24px] font-black tracking-[-0.03em] text-slate-900">
              예약 상세
            </div>
            <div className="mt-1 text-sm font-bold text-slate-500">
              예약 정보와 보관 내역을 확인할 수 있어요
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-rose-100 bg-white/90 px-4 py-2 text-sm font-extrabold text-slate-700 shadow-sm transition hover:bg-rose-50"
          >
            닫기
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          {loading ? (
            <StateBox tone="default" text="상세 정보를 불러오는 중입니다." />
          ) : errorText ? (
            <StateBox tone="error" text={errorText} />
          ) : data.length === 0 ? (
            <StateBox tone="default" text="상세 데이터가 없습니다." />
          ) : (
            <div className="space-y-6">
              <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <SummaryBox label="고객명" value={first?.mberNm?.trim() || "-"} />
                <SummaryBox label="전화번호" value={first?.tel?.trim() || "-"} />
                <SummaryBox
                  label="예약번호"
                  value={String(first?.reserveId ?? "-")}
                />
              </section>

              <TypeSection title="냉장" items={grouped.cold} tone="cold" />
              <TypeSection title="상온" items={grouped.room} tone="room" />
              <TypeSection title="캐리어" items={grouped.carrier} tone="carrier" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TypeSection({
  title,
  items,
  tone,
}: {
  title: string;
  items: ReserveUserDetailItem[];
  tone: "cold" | "room" | "carrier";
}) {
  if (items.length === 0) return null;

  const sectionTone = getSectionTone(tone);

  return (
    <section className="rounded-[28px] border border-white/80 bg-white/70 p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`inline-block h-3 w-3 rounded-full ${sectionTone.dot}`} />
          <h3 className="text-[20px] font-black tracking-[-0.03em] text-slate-900">
            {title}
          </h3>
        </div>

        <div
          className={[
            "rounded-full px-3 py-1.5 text-sm font-black",
            sectionTone.badge,
          ].join(" ")}
        >
          {items.length}건
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {items.map((item) => (
          <DetailCard
            key={`${item.id}-${item.storageId ?? "none"}`}
            item={item}
            tone={tone}
          />
        ))}
      </div>
    </section>
  );
}

function DetailCard({
  item,
  tone,
}: {
  item: ReserveUserDetailItem;
  tone: "cold" | "room" | "carrier";
}) {
  const statusText = formatStatus(item.reservationStatus?.trim() || "-");
  const cardTone = getCardTone(tone);

  return (
    <div
      className={[
        "rounded-[24px] border p-4 shadow-sm",
        cardTone.wrap,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[20px] font-black tracking-[-0.03em] text-slate-900">
            {item.storageId ? `${item.storageId}번` : "보관함 미지정"}
          </div>
          <div className="mt-1 inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-extrabold text-slate-600 shadow-sm">
            {formatStorageType(item.type)}
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

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field
          label="시작일시"
          value={formatReservationDate(
            item.reservationDay?.trim() || "-",
            item.reservationStartTime?.trim() || "-"
          )}
        />
        <Field label="이용시간" value={`${item.reservationTime ?? 0}분`} />
      </div>
    </div>
  );
}

function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(255,247,250,0.95)_100%)] px-4 py-4 shadow-sm">
      <div className="text-[11px] font-extrabold tracking-[0.04em] text-slate-400">
        {label}
      </div>
      <div className="mt-1 break-all text-[17px] font-black tracking-[-0.02em] text-slate-900">
        {value}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/90 bg-white/90 px-4 py-3 shadow-sm">
      <div className="text-[11px] font-extrabold tracking-[0.03em] text-slate-400">
        {label}
      </div>
      <div className="mt-1 break-all text-[15px] font-black tracking-[-0.02em] text-slate-900">
        {value}
      </div>
    </div>
  );
}

function StateBox({
  text,
  tone,
}: {
  text: string;
  tone: "default" | "error";
}) {
  return (
    <div
      className={[
        "rounded-[24px] px-4 py-12 text-center text-[15px] font-bold",
        tone === "error"
          ? "bg-rose-50 text-rose-600"
          : "bg-slate-50 text-slate-600",
      ].join(" ")}
    >
      {text}
    </div>
  );
}

function getSectionTone(tone: "cold" | "room" | "carrier") {
  if (tone === "cold") {
    return {
      dot: "bg-sky-400",
      badge: "bg-sky-50 text-sky-700 border border-sky-100",
    };
  }

  if (tone === "room") {
    return {
      dot: "bg-amber-400",
      badge: "bg-amber-50 text-amber-700 border border-amber-100",
    };
  }

  return {
    dot: "bg-violet-400",
    badge: "bg-violet-50 text-violet-700 border border-violet-100",
  };
}

function getCardTone(tone: "cold" | "room" | "carrier") {
  if (tone === "cold") {
    return {
      wrap: "border-sky-100 bg-[linear-gradient(180deg,rgba(240,249,255,0.95)_0%,rgba(255,255,255,0.96)_100%)]",
    };
  }

  if (tone === "room") {
    return {
      wrap: "border-amber-100 bg-[linear-gradient(180deg,rgba(255,251,235,0.95)_0%,rgba(255,255,255,0.96)_100%)]",
    };
  }

  return {
    wrap: "border-violet-100 bg-[linear-gradient(180deg,rgba(245,243,255,0.95)_0%,rgba(255,255,255,0.96)_100%)]",
    };
}

function getStatusTone(status: string) {
  if (status.includes("이용중") || status.includes("보관중")) {
    return "border border-emerald-100 bg-emerald-50 text-emerald-700";
  }

  if (status.includes("대기") || status.includes("예약")) {
    return "border border-amber-100 bg-amber-50 text-amber-700";
  }

  if (status.includes("완료") || status.includes("종료")) {
    return "border border-slate-200 bg-slate-100 text-slate-700";
  }

  return "border border-rose-100 bg-rose-50 text-rose-700";
}