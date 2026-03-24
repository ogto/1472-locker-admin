import type { HistoryFilterValue } from "@/lib/history/types";

type Props = {
  value: HistoryFilterValue;
  loading: boolean;
  onChange: (next: HistoryFilterValue) => void;
  onSearch: () => void;
  onReset: () => void;
};

const pointOptions = [
  { value: "bank", label: "성심당점" },
  { value: "sungsim", label: "으능정이점" },
  { value: "baseball", label: "한화생명볼파크점" },
];

export function HistoryFilterBar({
  value,
  loading,
  onChange,
  onSearch,
  onReset,
}: Props) {
  function updateField<K extends keyof HistoryFilterValue>(
    key: K,
    nextValue: HistoryFilterValue[K]
  ) {
    onChange({
      ...value,
      [key]: nextValue,
    });
  }

  return (
    <section className="rounded-[32px] border border-white/70 bg-white/80 p-4 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur xl:p-5">
      <div className="flex flex-col gap-4">
        <div>
          <div className="text-lg font-black tracking-tight text-slate-900">
            이용내역 조회
          </div>
          <div className="mt-1 text-sm font-medium text-slate-500">
            지점, 기간, 검색어로 이용내역을 확인할 수 있습니다.
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-extrabold text-slate-700">지점</span>
            <select
              value={value.point}
              onChange={(e) => updateField("point", e.target.value)}
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100"
            >
              {pointOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-extrabold text-slate-700">시작일</span>
            <input
              type="date"
              value={value.reservationStartDay}
              onChange={(e) =>
                updateField("reservationStartDay", e.target.value)
              }
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-extrabold text-slate-700">종료일</span>
            <input
              type="date"
              value={value.reservationEndDay}
              onChange={(e) => updateField("reservationEndDay", e.target.value)}
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100"
            />
          </label>

          <label className="flex flex-col gap-2 md:col-span-2 xl:col-span-2">
            <span className="text-sm font-extrabold text-slate-700">
              검색어
            </span>
            <input
              type="text"
              value={value.searchQuery}
              onChange={(e) => updateField("searchQuery", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onSearch();
                }
              }}
              placeholder="이름, 전화번호, 예약번호"
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none transition placeholder:font-semibold placeholder:text-slate-400 focus:border-pink-300 focus:ring-4 focus:ring-pink-100"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onReset}
            disabled={loading}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            초기화
          </button>

          <button
            type="button"
            onClick={onSearch}
            disabled={loading}
            className="h-12 rounded-2xl bg-gradient-to-r from-pink-400 to-rose-400 px-5 text-sm font-extrabold text-white shadow-lg shadow-pink-200 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "조회 중..." : "조회하기"}
          </button>
        </div>
      </div>
    </section>
  );
}