export function LockerHero() {
  return (
    <section className="rounded-[28px] border border-white/70 bg-white/70 p-5 shadow-[0_20px_50px_rgba(255,182,193,0.12)] backdrop-blur sm:rounded-[36px] sm:p-8">
      <div className="mb-4 inline-flex rounded-full bg-pink-100 px-4 py-2 text-xs font-black text-pink-600 sm:text-sm">
        🌸 빵다방 관리자
      </div>

      <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
        보관함 번호를 입력 후
        <br />
        열어주세요
      </h2>

      <p className="mt-4 max-w-xl text-sm leading-7 text-slate-500">
        문의: 010-4515-4243
      </p>

      <div className="mt-6 flex flex-wrap gap-2 sm:gap-3">
        <div className="rounded-full bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 sm:px-4 sm:text-sm">
          🧁 API: lock-command
        </div>
        <div className="rounded-full bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700 sm:px-4 sm:text-sm">
          🏦 지점: 꿈돌이 빵다방
        </div>
        <div className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 sm:px-4 sm:text-sm">
          🔢 범위: 1 ~ 320
        </div>
      </div>
    </section>
  );
}