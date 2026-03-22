type Props = {
  resultText: string;
};

export function LockerResultPanel({ resultText }: Props) {
  return (
    <div className="rounded-[28px] bg-slate-950 p-4 text-xs text-emerald-100 shadow-xl sm:rounded-[32px] sm:p-5 sm:text-sm">
      <div className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-300/80 sm:text-xs">
        Response Console
      </div>
      <pre className="max-h-[48vh] overflow-auto whitespace-pre-wrap break-words font-mono leading-6">
        {resultText}
      </pre>
    </div>
  );
}