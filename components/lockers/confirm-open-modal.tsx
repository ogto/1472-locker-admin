"use client";

type Props = {
  open: boolean;
  point: string;
  storageId: number | null;
  pulseMs: number;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmOpenModal({
  open,
  point,
  storageId,
  pulseMs,
  submitting,
  onClose,
  onConfirm,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[28px] border border-white/70 bg-white p-5 shadow-2xl sm:rounded-[32px] sm:p-6">
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
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
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
  );
}