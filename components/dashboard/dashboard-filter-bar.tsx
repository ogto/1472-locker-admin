import type { ZoneKey } from "@/lib/dashboard/types";

type Props = {
  filter: ZoneKey;
  keyword: string;
  onChangeFilter: (value: ZoneKey) => void;
  onChangeKeyword: (value: string) => void;
  onRefresh: () => void;
  loading: boolean;
};

function FilterButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group min-h-[52px] rounded-2xl px-4 py-3 text-[15px] font-extrabold tracking-[-0.02em] transition-all duration-200",
        "border",
        active
          ? "border-transparent bg-gradient-to-r from-rose-400 via-pink-400 to-orange-300 text-white shadow-[0_10px_30px_rgba(251,113,133,0.28)]"
          : "border-rose-100 bg-white text-slate-700 shadow-sm hover:border-rose-200 hover:bg-rose-50/60 hover:text-slate-900",
      ].join(" ")}
    >
      <span className="flex items-center gap-2">
        <span
          className={[
            "inline-block h-2.5 w-2.5 rounded-full transition",
            active ? "bg-white/90" : "bg-rose-300 group-hover:bg-rose-400",
          ].join(" ")}
        />
        {label}
      </span>
    </button>
  );
}

export function DashboardFilterBar({
  filter,
  keyword,
  onChangeFilter,
  onChangeKeyword,
  onRefresh,
  loading,
}: Props) {
  return (
    <section className="overflow-hidden rounded-[30px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(255,247,250,0.96)_100%)] p-4 shadow-[0_16px_50px_rgba(15,23,42,0.06)] backdrop-blur sm:p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-1 text-sm font-black tracking-[-0.02em] text-slate-500">
            채널 필터
          </div>

          <FilterButton
            active={filter === "all"}
            label="전체"
            onClick={() => onChangeFilter("all")}
          />
          <FilterButton
            active={filter === "app"}
            label="앱"
            onClick={() => onChangeFilter("app")}
          />
          <FilterButton
            active={filter === "kiosk"}
            label="키오스크"
            onClick={() => onChangeFilter("kiosk")}
          />
        </div>

        <div className="flex flex-col gap-3 lg:flex-row">
          <label className="group relative block flex-1">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg opacity-70">
              🔎
            </span>

            <input
              value={keyword}
              onChange={(e) => onChangeKeyword(e.target.value)}
              placeholder="예약번호, 이름, 전화번호, 비밀번호 검색"
              className={[
                "min-h-[58px] w-full rounded-2xl border bg-white/95 pl-12 pr-4 py-3 text-[16px] font-semibold text-slate-900 outline-none transition",
                "border-rose-100 shadow-sm placeholder:text-slate-400",
                "focus:border-rose-300 focus:shadow-[0_0_0_6px_rgba(251,113,133,0.12)]",
              ].join(" ")}
            />
          </label>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className={[
              "min-h-[58px] rounded-2xl px-5 py-3 text-[16px] font-black tracking-[-0.02em] text-white transition-all",
              "bg-gradient-to-r from-rose-400 via-pink-400 to-orange-300",
              "shadow-[0_12px_30px_rgba(251,113,133,0.28)]",
              "hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(251,113,133,0.32)]",
              "disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60",
            ].join(" ")}
          >
            {loading ? "불러오는 중..." : "새로고침"}
          </button>
        </div>
      </div>
    </section>
  );
}