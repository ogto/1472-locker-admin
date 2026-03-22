"use client";

import { AdminShell } from "@/components/admin/admin-shell";
import { AdminHeader } from "@/components/admin/admin-header";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { LoginCard } from "@/components/auth/login-card";

export default function AdminSettingsPage() {
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
    <AdminShell>
      <AdminHeader
        title="설정"
        description="관리자 비밀번호 변경, 지점 옵션, 운영 설정, 출퇴근 관리 연결"
        onLogout={auth.handleLogout}
      />
      <div className="rounded-[32px] border border-white/70 bg-white/80 p-10">
        <div className="text-5xl">⚙️</div>
        <h2 className="mt-4 text-2xl font-black">준비 중</h2>
        <p className="mt-2 text-sm text-slate-500">
          {/* 운영 설정, 기본 pulseMs, API 상태 표시 등 확장 가능하다. */}
        </p>
      </div>
    </AdminShell>
  );
}