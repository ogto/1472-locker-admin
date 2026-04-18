"use client";

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
  } | null;
  historyLoading?: boolean;
  historyError?: string;
  historyRows?: Array<{
    id: number;
    name: string;
    tel: string;
    timeRange: string;
    status: string;
  }>;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmOpenModal({
  open,
  point,
  storageId,
  pulseMs,
  submitting,
  userInfo,
  historyLoading = false,
  historyError = "",
  historyRows = [],
  onClose,
  onConfirm,
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
            </div>
          ) : (
            <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
              사용자 정보 없음
            </div>
          )}
        </div>

        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-black text-slate-900">오늘 이용 히스토리</div>

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
              오늘 이 보관함 이용 내역이 없습니다.
            </div>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs font-black text-slate-500">
                    <th className="px-2 py-1">이름</th>
                    <th className="px-2 py-1">전화번호</th>
                    <th className="px-2 py-1">이용시간</th>
                    <th className="px-2 py-1">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map((row) => (
                    <tr key={row.id} className="bg-slate-50 text-sm text-slate-700">
                      <td className="rounded-l-2xl px-2 py-2 font-bold text-slate-900">
                        {row.name}
                      </td>
                      <td className="px-2 py-2">{row.tel}</td>
                      <td className="px-2 py-2 font-semibold">
                        {row.timeRange}
                      </td>
                      <td className="rounded-r-2xl px-2 py-2">
                        <span
                          className={[
                            "inline-flex rounded-full px-2.5 py-1 text-xs font-black",
                            row.status === "이용중" || row.status === "보관중"
                              ? "bg-emerald-100 text-emerald-700"
                              : row.status === "취소"
                              ? "bg-rose-100 text-rose-600"
                              : "bg-slate-100 text-slate-600",
                          ].join(" ")}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <strong className="text-right text-slate-900">{value}</strong>
    </div>
  );
}
