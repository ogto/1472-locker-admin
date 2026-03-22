"use client";

import { ReactNode, useState } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminMobileSidebar } from "./admin-sidebar";

type Props = {
  children: ReactNode;
};

export function AdminShell({ children }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ffe4f1_0%,#fff4fa_22%,#f8fbff_55%,#f6f7ff_100%)]">
      {/* 모바일 드로어 */}
      <AdminMobileSidebar
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex min-h-screen">
        {/* 데스크탑 사이드바 */}
        <div className="hidden lg:block">
          <AdminSidebar />
        </div>

        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-5 sm:py-5 lg:px-8 lg:py-8">
            {/* 모바일 메뉴 버튼을 children 바깥에서 주입 */}
            <div className="mb-4 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/70 bg-white/90 px-4 py-3 text-sm font-black text-slate-800 shadow-sm"
              >
                <span>☰</span>
                <span>메뉴</span>
              </button>
            </div>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}