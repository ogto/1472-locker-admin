type Props = {
  type: "ok" | "error";
  text: string;
};

export function StatusBanner({ type, text }: Props) {
  const styles =
    type === "ok"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-rose-200 bg-rose-50 text-rose-700";

  return (
    <div className={`whitespace-pre-wrap rounded-3xl border p-4 text-sm font-semibold ${styles}`}>
      {text}
    </div>
  );
}