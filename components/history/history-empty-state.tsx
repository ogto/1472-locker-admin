type Props = {
  title: string;
  description: string;
};

export function HistoryEmptyState({ title, description }: Props) {
  return (
    <div className="rounded-[32px] border border-dashed border-slate-200 bg-white/80 px-6 py-16 text-center shadow-sm">
      <div className="text-5xl">🧺</div>
      <div className="mt-4 text-xl font-black tracking-tight text-slate-900">
        {title}
      </div>
      <div className="mt-2 text-sm font-medium leading-6 text-slate-500">
        {description}
      </div>
    </div>
  );
}