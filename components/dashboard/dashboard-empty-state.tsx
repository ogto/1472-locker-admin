export function DashboardEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/80 p-10 text-center shadow-sm">
      <div className="text-5xl">📦</div>
      <div className="mt-4 text-2xl font-black text-slate-900">{title}</div>
      <div className="mt-2 text-lg text-slate-500">{description}</div>
    </div>
  );
}