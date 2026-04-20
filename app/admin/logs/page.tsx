"use client";

import { AdminShell } from "@/components/admin/admin-shell";
import { AdminHeader } from "@/components/admin/admin-header";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { LoginCard } from "@/components/auth/login-card";

export default function AdminLogsPage() {
  const auth = useAdminAuth();

  if (auth.booting) {
    return <div className="grid min-h-screen place-items-center">불러오는 중...</div>;
  }

  if (!auth.authenticated) {
    return (
      <LoginCard
        password={auth.password}
        error={auth.loginError}
        loading={auth.loginLoading}
        onChangePassword={auth.setPassword}
        onSubmit={auth.handleLogin}
      />
    );
  }

  return (
    <AdminShell role={auth.role} onLogout={auth.handleLogout}>
      <AdminHeader
        title="명령 이력"
        description="명령 로그 API와 연결"
        onLogout={auth.handleLogout}
      />
      <div className="rounded-[32px] border border-white/70 bg-white/80 p-10">
        <div className="text-5xl">🧾</div>
        <h2 className="mt-4 text-2xl font-black">준비 중</h2>
        <p className="mt-2 text-sm text-slate-500">
          {/* 여기에는 락 오픈 명령 이력, 성공/실패 로그, 필터 검색이 들어가면 된다. */}
        </p>
      </div>
    </AdminShell>
  );
}
