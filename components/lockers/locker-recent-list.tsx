type Props = {
  items: number[];
  onSelect: (no: number) => void;
};

export function LockerRecentList({ items, onSelect }: Props) {
  if (!items.length) return null;

  return (
    <div>
      <div className="mb-2 text-sm font-bold text-slate-700">최근 사용</div>
      <div className="flex flex-wrap gap-2">
        {items.map((no) => (
          <button
            key={no}
            type="button"
            onClick={() => onSelect(no)}
            className="rounded-full border border-pink-100 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:bg-pink-50"
          >
            {no}번
          </button>
        ))}
      </div>
    </div>
  );
}