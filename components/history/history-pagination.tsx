type Props = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
};

export function HistoryPagination({
  page,
  totalPages,
  onChange,
}: Props) {
  if (totalPages <= 1) return null;

  const current = page + 1;
  const start = Math.max(1, current - 2);
  const end = Math.min(totalPages, start + 4);
  const pages: number[] = [];

  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 0}
        className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        이전
      </button>

      {pages.map((p) => {
        const active = p === current;

        return (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p - 1)}
            className={[
              "h-11 min-w-[44px] rounded-2xl px-4 text-sm font-extrabold transition",
              active
                ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
            ].join(" ")}
          >
            {p}
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages - 1}
        className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        다음
      </button>
    </div>
  );
}