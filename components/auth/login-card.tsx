"use client";

type Props = {
  password: string;
  error: string;
  loading: boolean;
  onChangePassword: (value: string) => void;
  onSubmit: () => void;
};

export function LoginCard({
  password,
  error,
  loading,
  onChangePassword,
  onSubmit,
}: Props) {
  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#ffe4f1_0%,#fff4fa_35%,#f8fbff_100%)] px-6">
      <div className="w-full max-w-md rounded-[32px] border border-white/70 bg-white/80 p-8 shadow-[0_20px_60px_rgba(255,145,194,0.18)] backdrop-blur">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-pink-200 via-rose-100 to-amber-100 text-3xl shadow-inner">
            🔐
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">빵다방</h1>
        </div>

        <div className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => onChangePassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSubmit();
            }}
            className="w-full rounded-2xl border border-pink-100 bg-white px-4 py-3 text-slate-900 outline-none ring-0 transition focus:border-pink-300 focus:shadow-[0_0_0_6px_rgba(251,207,232,0.35)]"
            placeholder="비밀번호 입력"
          />

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {error}
            </div>
          ) : null}

          <button
            type="button"
            onClick={onSubmit}
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-pink-400 via-rose-400 to-amber-300 px-4 py-3 text-sm font-black text-white shadow-lg shadow-pink-200 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "확인 중..." : "로그인"}
          </button>
        </div>
      </div>
    </div>
  );
}