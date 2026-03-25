"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminHeader } from "@/components/admin/admin-header";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { CctvGrid } from "@/components/cctv/cctv-grid";
import type { CctvCamera } from "@/lib/cctv/types";

type ApiResponse = {
  ok: boolean;
  items: CctvCamera[];
};

export default function AdminCctvPage() {
const auth = useAdminAuth();
  const [items, setItems] = useState<CctvCamera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchCctv = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/cctv", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("CCTV 목록을 불러오지 못했습니다.");
        }

        const data: ApiResponse = await res.json();

        if (!mounted) return;
        setItems(Array.isArray(data.items) ? data.items : []);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    fetchCctv();

    return () => {
      mounted = false;
    };
  }, []);

  return (
        <AdminShell role={auth.role}>
      <AdminHeader
        title="CCTV"
        onLogout={auth.handleLogout}
      />
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#e8f3ff_0%,#f6f9ff_28%,#fffafc_58%,#fffefe_100%)] px-4 py-6 md:px-6">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
        <section className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(148,163,184,0.14)] backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.24em] text-sky-500">
                CCTV
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.03em] text-slate-900">
                CCTV 모니터링
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-500">
                관리자용 실시간 화면 영역입니다.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
              총 {items.length}대
            </div>
          </div>
        </section>

        {loading ? (
          <section className="rounded-[28px] border border-white/70 bg-white/85 p-10 text-center text-sm font-semibold text-slate-500 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            CCTV 불러오는 중...
          </section>
        ) : error ? (
          <section className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-sm font-bold text-rose-600">
            {error}
          </section>
        ) : (
          <CctvGrid cameras={items} />
        )}
      </div>
    </main>
    </AdminShell>
  );
}