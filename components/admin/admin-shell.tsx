"use client";

import { ReactNode, useState } from "react";
import { AdminSidebar, AdminMobileSidebar } from "./admin-sidebar";
import type { AdminRole } from "@/lib/admin/types";

type Props = {
  children: ReactNode;
  role: AdminRole | null;
  onLogout?: () => void;
  contentClassName?: string;
};

export function AdminShell({
  children,
  role,
  onLogout,
  contentClassName,
}: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ffe4f1_0%,#fff4fa_22%,#f8fbff_55%,#f6f7ff_100%)]">
      <AdminMobileSidebar
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        role={role}
      />

      <div className="flex min-h-screen">
        <div className="hidden lg:block">
          <AdminSidebar role={role} />
        </div>

        <main className="min-w-0 flex-1">
          <div
            className={[
              "mx-auto max-w-7xl px-4 py-4 sm:px-5 sm:py-5 lg:px-8 lg:py-8",
              contentClassName ?? "",
            ].join(" ")}
          >
            <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/70 bg-white/90 px-4 py-3 text-sm font-black text-slate-800 shadow-sm"
              >
                <span>☰</span>
                <span>메뉴</span>
              </button>

              {onLogout ? (
                <button
                  type="button"
                  onClick={onLogout}
                  className="shrink-0 rounded-2xl border border-white/70 bg-white/90 px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5"
                >
                  로그아웃
                </button>
              ) : null}
            </div>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
