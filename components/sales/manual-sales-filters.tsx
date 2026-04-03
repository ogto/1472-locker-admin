"use client";

import type { PointKey } from "@/lib/sales/types";

type Props = {
  point: PointKey;
  date: string;
  loading?: boolean;
  onChangePoint: (value: PointKey) => void;
  onChangeDate: (value: string) => void;
  onRefresh: () => void;
};

export function ManualSalesFilters({
  point,
  date,
  loading = false,
  onChangePoint,
  onChangeDate,
  onRefresh,
}: Props) {
  return (
    <section className="rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur sm:p-5">
      <div className="grid gap-3 md:grid-cols-[180px_200px_140px]">
        <label className="space-y-2">
          <div className="text-[13px] font-black text-slate-500">지점</div>
          <select
            value={point}
            onChange={(e) => onChangePoint(e.target.value as PointKey)}
            disabled={loading}
            className="w-full rounded-[18px] border border-slate-200 px-4 py-3 text-[15px] font-bold text-slate-800 outline-none focus:border-slate-400"
          >
            <option value="bank">은행점</option>
            <option value="sungsim">으능정이점</option>
            <option value="baseball">야구장점</option>
          </select>
        </label>

        <label className="space-y-2">
          <div className="text-[13px] font-black text-slate-500">날짜</div>
          <input
            type="date"
            value={date}
            onChange={(e) => onChangeDate(e.target.value)}
            disabled={loading}
            className="w-full rounded-[18px] border border-slate-200 px-4 py-3 text-[15px] font-bold text-slate-800 outline-none focus:border-slate-400"
          />
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-[15px] font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            새로고침
          </button>
        </div>
      </div>
    </section>
  );
}