"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { groupDetailByType } from "@/lib/dashboard/mapper";
import {
  formatPrice,
  formatReservationDate,
  formatStatus,
  formatStorageType,
  isTwentyFourHourUsage,
} from "@/lib/common";
import type { ReserveUserDetailItem } from "@/lib/dashboard/types";

type Props = {
  open: boolean;
  loading: boolean;
  errorText: string;
  successText: string;
  data: ReserveUserDetailItem[];
  pickupLoading: boolean;
  cancelLoading: boolean;
  openLockerLoadingId: number | null;
  onPickup: () => Promise<void> | void;
  onCancelReserve: () => Promise<void> | void;
  onOpenLocker: (item: ReserveUserDetailItem) => Promise<void> | void;
  onClose: () => void;
};

export function DashboardDetailModal({
  open,
  loading,
  errorText,
  successText,
  data,
  pickupLoading,
  cancelLoading,
  openLockerLoadingId,
  onPickup,
  onCancelReserve,
  onOpenLocker,
  onClose,
}: Props) {
  const [pickupConfirmOpen, setPickupConfirmOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [openTarget, setOpenTarget] = useState<ReserveUserDetailItem | null>(
    null
  );

  const first = data[0];
  const grouped = groupDetailByType(data);
  const paidAmount = data.reduce((sum, item) => sum + safeAmount(item.price), 0);
  const hasFullDayUsage = data.some((item) =>
    isTwentyFourHourUsage(item.reservationTime)
  );

  const pickupTargets = data.filter((item) => {
    const status = item.reservationStatus?.trim().toUpperCase() || "";

    return (
      item.id != null &&
      item.reserveId != null &&
      status !== "PICKUP" &&
      status !== "CANCEL" &&
      status !== "CANCELED"
    );
  });

  const canPickup = pickupTargets.length > 0;
  const canCancel = data.some((item) => {
    const status = item.reservationStatus?.trim().toUpperCase() || "";

    return (
      item.reserveId != null &&
      item.point === "bank" &&
      status !== "PICKUP" &&
      status !== "CANCEL" &&
      status !== "CANCELED"
    );
  });

  const handleClose = () => {
    setPickupConfirmOpen(false);
    setCancelConfirmOpen(false);
    setOpenTarget(null);
    onClose();
  };

  const handleConfirmPickup = async () => {
    await onPickup();
    setPickupConfirmOpen(false);
  };

  const handleConfirmCancel = async () => {
    await onCancelReserve();
    setCancelConfirmOpen(false);
  };

  const handleConfirmOpenLocker = async () => {
    if (!openTarget) return;

    await onOpenLocker(openTarget);
    setOpenTarget(null);
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.46)] p-3 backdrop-blur-[3px] sm:p-4"
        onClick={handleClose}
      >
        <div
          className={[
            "flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border shadow-[0_24px_80px_rgba(15,23,42,0.22)] sm:rounded-[32px]",
            hasFullDayUsage
              ? "border-cyan-100/80 bg-[linear-gradient(180deg,rgba(236,254,255,0.98)_0%,rgba(238,242,255,0.96)_100%)]"
              : "border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(255,247,249,0.96)_100%)]",
          ].join(" ")}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={[
              "flex flex-col gap-4 border-b px-4 py-4 sm:px-6 sm:py-5 md:flex-row md:items-center md:justify-between",
              hasFullDayUsage ? "border-cyan-100" : "border-rose-100",
            ].join(" ")}
          >
            <div className="min-w-0">
              <div className="text-[21px] font-black tracking-[-0.03em] text-slate-900 sm:text-[24px]">
                예약 상세
              </div>
              <div className="mt-1 text-[13px] font-bold text-slate-500 sm:text-sm">
                예약 정보와 보관함 이용 내역을 확인할 수 있습니다.
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end md:w-auto">
              {canCancel ? (
                <button
                  type="button"
                  onClick={() => setCancelConfirmOpen(true)}
                  disabled={cancelLoading}
                  className="inline-flex min-h-[44px] w-full items-center justify-center whitespace-nowrap rounded-2xl border border-rose-100 bg-rose-50 px-4 py-2.5 text-[14px] font-extrabold text-rose-700 shadow-sm transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[120px]"
                >
                  {cancelLoading ? "처리중..." : "예약취소"}
                </button>
              ) : null}

              {canPickup ? (
                <button
                  type="button"
                  onClick={() => setPickupConfirmOpen(true)}
                  disabled={pickupLoading}
                  className="inline-flex min-h-[44px] w-full items-center justify-center whitespace-nowrap rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-[14px] font-extrabold text-emerald-700 shadow-sm transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[120px]"
                >
                  {pickupLoading ? "처리중..." : "픽업 완료"}
                </button>
              ) : null}

              <button
                type="button"
                onClick={handleClose}
                className="inline-flex min-h-[44px] w-full items-center justify-center whitespace-nowrap rounded-2xl border border-rose-100 bg-white/90 px-4 py-2.5 text-[14px] font-extrabold text-slate-700 shadow-sm transition hover:bg-rose-50 sm:w-auto sm:min-w-[96px]"
              >
                닫기
              </button>
            </div>
          </div>

          <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            {loading ? (
              <StateBox tone="default" text="상세 정보를 불러오는 중입니다." />
            ) : data.length === 0 ? (
              <StateBox tone="default" text="상세 데이터가 없습니다." />
            ) : (
              <div className="space-y-5 sm:space-y-6">
                {errorText ? <StateBox tone="error" text={errorText} /> : null}
                {successText ? <StateBox tone="ok" text={successText} /> : null}

                <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <SummaryBox label="고객명" value={first?.mberNm?.trim() || "-"} />
                  <SummaryBox label="전화번호" value={first?.tel?.trim() || "-"} />
                  <SummaryBox
                    label="방문횟수"
                    value={
                      first?.visitSeq && first.visitSeq > 0
                        ? `${first.visitSeq}번째 방문`
                        : "-"
                    }
                  />
                  <SummaryBox
                    label="예약번호"
                    value={String(first?.reserveId ?? "-")}
                  />
                </section>

                <section className="grid grid-cols-1 gap-3 md:grid-cols-1">
                  <SummaryBox label="결제금액" value={formatPrice(paidAmount)} />
                </section>

                <TypeSection
                  title="냉장"
                  items={grouped.cold}
                  tone="cold"
                  openLockerLoadingId={openLockerLoadingId}
                  onOpenLocker={setOpenTarget}
                />
                <TypeSection
                  title="상온"
                  items={grouped.room}
                  tone="room"
                  openLockerLoadingId={openLockerLoadingId}
                  onOpenLocker={setOpenTarget}
                />
                <TypeSection
                  title="캐리어"
                  items={grouped.carrier}
                  tone="carrier"
                  openLockerLoadingId={openLockerLoadingId}
                  onOpenLocker={setOpenTarget}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {pickupConfirmOpen ? (
        <ConfirmPickupModal
          loading={pickupLoading}
          count={pickupTargets.length}
          customerName={first?.mberNm?.trim() || "-"}
          onConfirm={handleConfirmPickup}
          onCancel={() => {
            if (!pickupLoading) setPickupConfirmOpen(false);
          }}
        />
      ) : null}

      {cancelConfirmOpen ? (
        <ConfirmCancelModal
          loading={cancelLoading}
          customerName={first?.mberNm?.trim() || "-"}
          reserveId={first?.reserveId ?? null}
          onConfirm={handleConfirmCancel}
          onCancel={() => {
            if (!cancelLoading) setCancelConfirmOpen(false);
          }}
        />
      ) : null}

      {openTarget ? (
        <ConfirmOpenLockerModal
          loading={openLockerLoadingId === openTarget.storageId}
          storageId={openTarget.storageId ?? null}
          onConfirm={handleConfirmOpenLocker}
          onCancel={() => {
            if (!openLockerLoadingId) setOpenTarget(null);
          }}
        />
      ) : null}
    </>
  );
}

function ConfirmPickupModal({
  loading,
  count,
  customerName,
  onConfirm,
  onCancel,
}: {
  loading: boolean;
  count: number;
  customerName: string;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}) {
  return (
    <ConfirmModalFrame onCancel={onCancel}>
      <ConfirmHeader title="픽업 완료 처리" description="실행 후 목록과 상태가 바로 갱신됩니다." />

      <div className="mt-5 rounded-[22px] border border-amber-100 bg-amber-50/70 px-4 py-4">
        <div className="text-[14px] font-bold leading-6 text-slate-700">
          <span className="font-black text-slate-900">{customerName}</span> 고객의
          픽업 대상 <span className="font-black text-slate-900">{count}건</span>을
          픽업 완료 처리할까요?
        </div>
      </div>

      <ConfirmActions
        loading={loading}
        cancelText="취소"
        confirmText="확인 후 완료"
        loadingText="처리중..."
        confirmClassName="border-emerald-100 bg-emerald-500 text-white"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    </ConfirmModalFrame>
  );
}

function ConfirmCancelModal({
  loading,
  customerName,
  reserveId,
  onConfirm,
  onCancel,
}: {
  loading: boolean;
  customerName: string;
  reserveId: number | null;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}) {
  return (
    <ConfirmModalFrame onCancel={onCancel}>
      <ConfirmHeader title="예약취소" description="취소 후 목록과 상태가 바로 갱신됩니다." />

      <div className="mt-5 rounded-[22px] border border-rose-100 bg-rose-50/70 px-4 py-4">
        <div className="text-[14px] font-bold leading-6 text-slate-700">
          <span className="font-black text-slate-900">{customerName}</span> 고객의
          예약
          <span className="mx-1 font-black text-slate-900">
            #{reserveId ?? "-"}
          </span>
          건을 정말 취소할까요?
        </div>
      </div>

      <ConfirmActions
        loading={loading}
        cancelText="닫기"
        confirmText="확인"
        loadingText="처리중..."
        confirmClassName="border-rose-100 bg-rose-500 text-white"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    </ConfirmModalFrame>
  );
}

function ConfirmOpenLockerModal({
  loading,
  storageId,
  onConfirm,
  onCancel,
}: {
  loading: boolean;
  storageId: number | null;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}) {
  return (
    <ConfirmModalFrame onCancel={onCancel}>
      <ConfirmHeader title="보관함 열기" description="선택한 보관함에 열기 명령을 보냅니다." />

      <div className="mt-5 rounded-[22px] border border-sky-100 bg-sky-50/70 px-4 py-4">
        <div className="text-[14px] font-bold leading-6 text-slate-700">
          <span className="font-black text-slate-900">
            {storageId == null ? "-" : `${storageId}번`}
          </span>
          보관함을 정말 열까요?
        </div>
      </div>

      <ConfirmActions
        loading={loading}
        cancelText="취소"
        confirmText="열기 실행"
        loadingText="전송 중..."
        confirmClassName="border-sky-100 bg-sky-500 text-white"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    </ConfirmModalFrame>
  );
}

function ConfirmModalFrame({
  children,
  onCancel,
}: {
  children: ReactNode;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(15,23,42,0.52)] p-4 backdrop-blur-[2px]"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.22)] sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function ConfirmHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-amber-50 text-[18px] font-black text-amber-600">
        !
      </div>
      <div className="min-w-0">
        <div className="text-[20px] font-black tracking-[-0.03em] text-slate-900">
          {title}
        </div>
        <div className="mt-1 text-[13px] font-bold text-slate-500">
          {description}
        </div>
      </div>
    </div>
  );
}

function ConfirmActions({
  loading,
  cancelText,
  confirmText,
  loadingText,
  confirmClassName,
  onCancel,
  onConfirm,
}: {
  loading: boolean;
  cancelText: string;
  confirmText: string;
  loadingText: string;
  confirmClassName: string;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
}) {
  return (
    <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="inline-flex min-h-[44px] w-full items-center justify-center whitespace-nowrap rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] font-extrabold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[96px]"
      >
        {cancelText}
      </button>

      <button
        type="button"
        onClick={onConfirm}
        disabled={loading}
        className={[
          "inline-flex min-h-[44px] w-full items-center justify-center whitespace-nowrap rounded-2xl px-4 py-2.5 text-[14px] font-extrabold shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[132px]",
          confirmClassName,
        ].join(" ")}
      >
        {loading ? loadingText : confirmText}
      </button>
    </div>
  );
}

function TypeSection({
  title,
  items,
  tone,
  openLockerLoadingId,
  onOpenLocker,
}: {
  title: string;
  items: ReserveUserDetailItem[];
  tone: "cold" | "room" | "carrier";
  openLockerLoadingId: number | null;
  onOpenLocker: (item: ReserveUserDetailItem) => void;
}) {
  if (items.length === 0) return null;

  const sectionTone = getSectionTone(tone);

  return (
    <section className="rounded-[24px] border border-white/80 bg-white/70 p-4 shadow-sm sm:rounded-[28px]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`inline-block h-3 w-3 rounded-full ${sectionTone.dot}`} />
          <h3 className="text-[18px] font-black tracking-[-0.03em] text-slate-900 sm:text-[20px]">
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
            openLoading={openLockerLoadingId === item.storageId}
            onOpenLocker={() => onOpenLocker(item)}
          />
        ))}
      </div>
    </section>
  );
}

function DetailCard({
  item,
  tone,
  openLoading,
  onOpenLocker,
}: {
  item: ReserveUserDetailItem;
  tone: "cold" | "room" | "carrier";
  openLoading: boolean;
  onOpenLocker: () => void;
}) {
  const statusText = formatStatus(item.reservationStatus?.trim() || "-");
  const fullDay = isTwentyFourHourUsage(item.reservationTime);
  const cardTone = fullDay ? getFullDayCardTone() : getCardTone(tone);
  const canOpen = Number.isInteger(Number(item.storageId));

  return (
    <div
      className={[
        "rounded-[22px] border p-4 shadow-sm sm:rounded-[24px]",
        cardTone.wrap,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[18px] font-black tracking-[-0.03em] text-slate-900 sm:text-[20px]">
            {item.storageId ? `${item.storageId}번` : "보관함 미지정"}
          </div>
          <div className="mt-1 inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-extrabold text-slate-600 shadow-sm">
            {formatStorageType(item.type)}
          </div>
          {fullDay ? (
            <div className="mt-2 inline-flex rounded-full border border-cyan-200 bg-cyan-100 px-3 py-1 text-xs font-black text-cyan-800">
              24H
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div
            className={[
              "rounded-full px-3 py-2 text-xs font-black",
              getStatusTone(statusText),
            ].join(" ")}
          >
            {statusText}
          </div>

          <button
            type="button"
            onClick={onOpenLocker}
            disabled={!canOpen || openLoading}
            className="inline-flex min-h-[34px] items-center justify-center whitespace-nowrap rounded-xl border border-sky-100 bg-sky-50 px-3 py-1.5 text-xs font-black text-sky-700 shadow-sm transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {openLoading ? "전송 중..." : "열기"}
          </button>
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
        <Field label="결제금액" value={formatPrice(item.price)} />
      </div>
    </div>
  );
}

function safeAmount(value?: number | null) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(255,247,250,0.95)_100%)] px-4 py-4 shadow-sm sm:rounded-[22px]">
      <div className="text-[11px] font-extrabold tracking-[0.04em] text-slate-400">
        {label}
      </div>
      <div className="mt-1 break-all text-[16px] font-black tracking-[-0.02em] text-slate-900 sm:text-[17px]">
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
      <div className="mt-1 break-all text-[14px] font-black tracking-[-0.02em] text-slate-900 sm:text-[15px]">
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
  tone: "default" | "error" | "ok";
}) {
  return (
    <div
      className={[
        "rounded-[24px] px-4 py-4 text-center text-[15px] font-bold",
        tone === "error"
          ? "bg-rose-50 text-rose-600"
          : tone === "ok"
          ? "bg-emerald-50 text-emerald-700"
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
      badge: "border border-sky-100 bg-sky-50 text-sky-700",
    };
  }

  if (tone === "room") {
    return {
      dot: "bg-amber-400",
      badge: "border border-amber-100 bg-amber-50 text-amber-700",
    };
  }

  return {
    dot: "bg-violet-400",
    badge: "border border-violet-100 bg-violet-50 text-violet-700",
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

function getFullDayCardTone() {
  return {
    wrap: "border-cyan-200 bg-[linear-gradient(180deg,rgba(236,254,255,0.96)_0%,rgba(238,242,255,0.96)_100%)]",
  };
}

function getStatusTone(status: string) {
  if (status.includes("이용중") || status.includes("보관중")) {
    return "border border-emerald-100 bg-emerald-50 text-emerald-700";
  }

  if (status.includes("대기") || status.includes("예약")) {
    return "border border-amber-100 bg-amber-50 text-amber-700";
  }

  return "border border-rose-100 bg-rose-50 text-rose-700";
}
