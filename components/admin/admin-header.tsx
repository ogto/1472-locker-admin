"use client";

type Props = {
  title: string;
  description?: string;
  onLogout: () => void;
};

export function AdminHeader({ title, description, onLogout }: Props) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-base leading-7 text-slate-500">
            {description}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="self-start rounded-2xl border border-white/70 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5"
      >
        로그아웃
      </button>
    </div>
  );
}