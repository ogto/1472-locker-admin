import type { PointKey, SalesPeriodType } from "@/lib/sales/types";

type Props = {
  periodType: SalesPeriodType;
  point: PointKey;
  year: number;
  month: number;
  date: string;
  loading: boolean;
  onChangePeriodType: (value: SalesPeriodType) => void;
  onChangePoint: (value: PointKey) => void;
  onChangeYear: (value: number) => void;
  onChangeMonth: (value: number) => void;
  onChangeDate: (value: string) => void;
  onRefresh: () => void;
};

const pointOptions: { label: string; value: PointKey }[] = [
  { label: "으능정이점", value: "sungsim" },
  { label: "야구장점", value: "baseball" },
  { label: "은행점", value: "bank" },
];

export function SalesFilters({
  periodType,
  point,
  year,
  month,
  date,
  loading,
  onChangePeriodType,
  onChangePoint,
  onChangeYear,
  onChangeMonth,
  onChangeDate,
  onRefresh,
}: Props) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChangePeriodType("daily")}
          className={[
            "rounded-2xl px-4 py-2 text-sm font-black transition",
            periodType === "daily"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200",
          ].join(" ")}
        >
          일별
        </button>
        <button
          type="button"
          onClick={() => onChangePeriodType("month")}
          className={[
            "rounded-2xl px-4 py-2 text-sm font-black transition",
            periodType === "month"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200",
          ].join(" ")}
        >
          월별
        </button>
      </div>

      <div
        className={[
          "grid gap-4",
          periodType === "month" ? "md:grid-cols-4" : "md:grid-cols-3",
        ].join(" ")}
      >
        <label className="flex flex-col gap-2">
          <span className="text-sm font-bold text-slate-600">지점</span>
          <select
            value={point}
            onChange={(e) => onChangePoint(e.target.value as PointKey)}
            className="h-12 rounded-2xl border border-slate-200 px-4 outline-none"
          >
            {pointOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {periodType === "month" ? (
          <>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-bold text-slate-600">연도</span>
              <input
                type="number"
                value={year}
                onChange={(e) => onChangeYear(Number(e.target.value))}
                className="h-12 rounded-2xl border border-slate-200 px-4 outline-none"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-bold text-slate-600">월</span>
              <input
                type="number"
                min={1}
                max={12}
                value={month}
                onChange={(e) => onChangeMonth(Number(e.target.value))}
                className="h-12 rounded-2xl border border-slate-200 px-4 outline-none"
              />
            </label>
          </>
        ) : (
          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold text-slate-600">날짜</span>
            <input
              type="date"
              value={date}
              onChange={(e) => onChangeDate(e.target.value)}
              className="h-12 rounded-2xl border border-slate-200 px-4 outline-none"
            />
          </label>
        )}

        <div className="flex items-end">
          <button
            type="button"
            disabled={loading}
            onClick={onRefresh}
            className="h-12 w-full rounded-2xl bg-slate-900 px-4 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "불러오는 중..." : "새로고침"}
          </button>
        </div>
      </div>
    </section>
  );
}