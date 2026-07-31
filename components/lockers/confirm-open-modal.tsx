"use client";

import { formatPrice } from "@/lib/common";

type Props = {
  open: boolean;
  point: string;
  storageId: number | null;
  pulseMs: number;
  submitting: boolean;
  userInfo?: {
    name: string;
    tel: string;
    channel: string;
    reservationDate: string;
    status: string;
    visitText?: string;
  } | null;
  currentPaidAmount?: number | null;
  disabled?: boolean;
  disableSubmitting?: boolean;
  pickupSubmitting?: boolean;
  canPickupCurrentUser?: boolean;
  pickupTargetCount?: number;
  pickupBlockedReason?: string;
  historyLoading?: boolean;
  historyError?: string;
  historyRows?: Array<{
    id: number;
    name: string;
    tel: string;
    timeRange: string;
    status: string;
    paidAmount: number | null;
  }>;
  onClose: () => void;
  onConfirm: () => void;
  onToggleDisabled?: () => void;
  onPickupCurrentUser?: () => void;
};

export function ConfirmOpenModal({
  open,
  point,
  storageId,
  pulseMs,
  submitting,
  userInfo,
  currentPaidAmount = null,
  disabled = false,
  disableSubmitting = false,
  pickupSubmitting = false,
  canPickupCurrentUser = false,
  pickupTargetCount = 0,
  pickupBlockedReason = "",
  historyLoading = false,
  historyError = "",
  historyRows = [],
  onClose,
  onConfirm,
  onToggleDisabled,
  onPickupCurrentUser,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 px-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white p-5 shadow-2xl sm:rounded-[32px] sm:p-6">
        <div className="overflow-y-auto pr-1">
        <div className="mb-4 inline-flex rounded-full bg-pink-100 px-4 py-2 text-sm font-black text-pink-600">
          🪄 마지막 확인
        </div>

        <h3 className="text-2xl font-black tracking-tight text-slate-900">
          정말 열기 명령을 보낼까요?
        </h3>

        <div className="mt-5 space-y-3 rounded-3xl bg-slate-50 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">지점</span>
            <strong className="text-slate-900">{point}</strong>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">보관함</span>
            <strong className="text-slate-900">
              {storageId == null ? "-" : `${storageId}번`}
            </strong>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">열림 시간</span>
            <strong className="text-slate-900">{pulseMs}ms</strong>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">사용 상태</span>
            <strong className={disabled ? "text-rose-600" : "text-emerald-600"}>
              {disabled ? "사용불가" : "사용가능"}
            </strong>
          </div>
        </div>

        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-black text-slate-900">현재 사용중인 사람</div>

          {userInfo ? (
            <div className="mt-3 space-y-2 text-sm">
              <Row label="이름" value={userInfo.name} />
              <Row label="연락처" value={userInfo.tel} />
              <Row label="채널" value={userInfo.channel} />
              <Row label="예약일시" value={userInfo.reservationDate} />
              <Row label="상태" value={userInfo.status} />
              <Row label="방문횟수" value={userInfo.visitText || "-"} />
              <Row
                label="결제금액"
                value={
                  currentPaidAmount == null ? "확인 불가" : formatPrice(currentPaidAmount)
                }
                valueClassName="text-pink-600"
              />
            </div>
          ) : (
            <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
              사용자 정보 없음
            </div>
          )}
        </div>

        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-black text-slate-900">보관함 이용 히스토리</div>

          {historyLoading ? (
            <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
              히스토리를 불러오는 중...
            </div>
          ) : historyError ? (
            <div className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
              {historyError}
            </div>
          ) : historyRows.length === 0 ? (
            <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
              이 보관함 이용 내역이 없습니다.
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {historyRows.map((row) => (
                <article
                  key={row.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-black text-slate-900">{row.name}</div>
                      <div className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                        {row.tel}
                      </div>
                    </div>
                    <span
                      className={[
                        "shrink-0 rounded-full px-2.5 py-1 text-xs font-black",
                        row.status === "이용중" || row.status === "보관중"
                          ? "bg-emerald-100 text-emerald-700"
                          : row.status === "취소"
                            ? "bg-rose-100 text-rose-600"
                            : "bg-white text-slate-600 ring-1 ring-slate-200",
                      ].join(" ")}
                    >
                      {row.status}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-200/80 pt-3">
                    <HistoryValue label="이용시간" value={row.timeRange} />
                    <HistoryValue
                      label="결제금액"
                      value={row.paidAmount == null ? "확인 불가" : formatPrice(row.paidAmount)}
                      accent
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {onToggleDisabled ? (
            <button
              type="button"
              onClick={onToggleDisabled}
              disabled={disableSubmitting}
              className={[
                "w-full rounded-2xl px-4 py-3 text-sm font-black transition disabled:opacity-60",
                disabled
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border border-rose-200 bg-rose-50 text-rose-600",
              ].join(" ")}
            >
              {disableSubmitting
                ? disabled
                  ? "사용가능으로 변경 중..."
                  : "사용불가 설정 중..."
                : disabled
                ? "사용가능으로 변경"
                : "사용불가로 설정"}
            </button>
          ) : null}

          {onPickupCurrentUser ? (
            <button
              type="button"
              onClick={onPickupCurrentUser}
              disabled={!canPickupCurrentUser || pickupSubmitting}
              className="w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pickupSubmitting
                ? "픽업완료 처리 중..."
                : canPickupCurrentUser
                ? pickupTargetCount > 1
                  ? `해당 보관함만 픽업완료 (${pickupTargetCount}건)`
                  : "해당 보관함만 픽업완료"
                : pickupBlockedReason || "픽업완료 대상 없음"}
            </button>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="flex-1 rounded-2xl bg-gradient-to-r from-pink-400 via-rose-400 to-amber-300 px-4 py-3 text-sm font-black text-white shadow-lg shadow-pink-200 disabled:opacity-60"
          >
            {submitting ? "전송 중..." : "열기 실행"}
          </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  valueClassName = "",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <strong className={`text-right text-slate-900 ${valueClassName}`}>{value}</strong>
    </div>
  );
}

function HistoryValue({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-bold text-slate-400">{label}</div>
      <div
        className={[
          "mt-1 break-words text-sm font-black",
          accent ? "text-pink-600" : "text-slate-700",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}
