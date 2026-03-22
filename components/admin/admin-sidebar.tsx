"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/admin/types";

const menus: NavItem[] = [
  { href: "/admin/dashboard", label: "현황판", emoji: "📊" },
  { href: "/admin/lockers", label: "보관함 제어", emoji: "🧰" },
  { href: "/admin/logs", label: "명령 이력", emoji: "🧾" },
  { href: "/admin/devices", label: "장치 상태", emoji: "📡" },
  { href: "/admin/settings", label: "설정", emoji: "⚙️" },
];

function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <div className="p-4 sm:p-6">
        <div className="rounded-[28px] bg-gradient-to-br from-pink-100 via-rose-50 to-amber-50 p-5 shadow-sm">
          <div className="text-sm font-bold text-pink-500">빵다방 ADMIN</div>
          <div className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            관리자실
          </div>
          {/* <div className="mt-2 text-sm leading-6 text-slate-500">
            락 오픈, 로그, 장치 상태를 한 번에 관리
          </div> */}
        </div>
      </div>

      <nav className="px-3 pb-6 sm:px-4">
        <ul className="space-y-2">
          {menus.map((menu) => {
            const active = pathname === menu.href;
            return (
              <li key={menu.href}>
                <Link
                  href={menu.href}
                  onClick={onNavigate}
                  className={[
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition",
                    active
                      ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-lg shadow-pink-200"
                      : "text-slate-700 hover:bg-white",
                  ].join(" ")}
                >
                  <span>{menu.emoji}</span>
                  <span>{menu.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

export function AdminSidebar() {
  return (
    <aside className="h-screen w-72 shrink-0 border-r border-white/60 bg-white/70 backdrop-blur-xl">
      <SidebarInner />
    </aside>
  );
}

export function AdminMobileSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="absolute left-0 top-0 h-full w-[86vw] max-w-[320px] border-r border-white/60 bg-white/95 shadow-2xl">
        <div className="flex items-center justify-between px-4 pt-4 sm:px-6">
          <div className="text-lg font-black text-slate-900">메뉴</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700"
          >
            닫기
          </button>
        </div>

        <SidebarInner onNavigate={onClose} />
      </aside>
    </div>
  );
}