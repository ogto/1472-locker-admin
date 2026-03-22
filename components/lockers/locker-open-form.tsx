"use client";

import { LockerRecentList } from "./locker-recent-list";
import { sanitizeNumericInput } from "@/lib/lockers/validators";

type Props = {
  point: string;
  setPoint: (value: string) => void;
  storageInput: string;
  setStorageInput: (value: string) => void;
  pulseMs: number;
  setPulseMs: (value: number) => void;
  selectedMeta: { value: string; helper: string };
  recentStorageIds: number[];
  onRecentClick: (no: number) => void;
  onOpenClick: () => void;
  onReset: () => void;
  clearStatus: () => void;
};

export function LockerOpenForm({
  point,
  setPoint,
  storageInput,
  setStorageInput,
  pulseMs,
  setPulseMs,
  selectedMeta,
  recentStorageIds,
  onRecentClick,
  onOpenClick,
  onReset,
  clearStatus,
}: Props) {
  return (
    <section className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_20px_50px_rgba(255,182,193,0.12)] backdrop-blur">
      <h3 className="mb-5 text-2xl font-black tracking-tight text-slate-900">오픈 요청</h3>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">지점</label>
          <input
            value={point}
            onChange={(e) => setPoint(e.target.value)}
            className="w-full rounded-2xl border border-pink-100 bg-white px-4 py-3 outline-none transition focus:border-pink-300 focus:shadow-[0_0_0_6px_rgba(251,207,232,0.35)]"
            disabled
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">보관함 번호</label>
          <input
            type="number"
            inputMode="numeric"
            value={storageInput}
            onChange={(e) => {
              clearStatus();
              setStorageInput(sanitizeNumericInput(e.target.value));
            }}
            className="w-full rounded-2xl border border-pink-100 bg-white px-4 py-3 outline-none transition focus:border-pink-300 focus:shadow-[0_0_0_6px_rgba(251,207,232,0.35)]"
            placeholder="1~320"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">열림 시간(ms)</label>
          <input
            type="number"
            inputMode="numeric"
            value={pulseMs}
            onChange={(e) => setPulseMs(Number(e.target.value))}
            className="w-full rounded-2xl border border-pink-100 bg-white px-4 py-3 outline-none transition focus:border-pink-300 focus:shadow-[0_0_0_6px_rgba(251,207,232,0.35)]"
            disabled
          />
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-pink-50 via-rose-50 to-amber-50 p-4">
          <div className="text-sm font-black text-slate-900">{selectedMeta.value}</div>
          <div className="mt-1 text-xs text-slate-500">{selectedMeta.helper}</div>
        </div>

        <LockerRecentList items={recentStorageIds} onSelect={onRecentClick} />

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onOpenClick}
            className="flex-1 rounded-2xl bg-gradient-to-r from-pink-400 via-rose-400 to-amber-300 px-4 py-3 text-sm font-black text-white shadow-lg shadow-pink-200 transition hover:scale-[1.01]"
          >
            입력 후 열기
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm"
          >
            초기화
          </button>
        </div>
      </div>
    </section>
  );
}