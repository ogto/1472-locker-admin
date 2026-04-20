"use client";

import { AdminShell } from "@/components/admin/admin-shell";
import { AdminHeader } from "@/components/admin/admin-header";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { LoginCard } from "@/components/auth/login-card";

export default function AdminDevicesPage() {
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
        title="장치 상태"
        description="ESP32 / 장치 헬스체크와 연결"
        onLogout={auth.handleLogout}
      />
      <div className="rounded-[32px] border border-white/70 bg-white/80 p-10">
        <div className="text-5xl">📡</div>
        <h2 className="mt-4 text-2xl font-black">준비 중</h2>
        <p className="mt-2 text-sm text-slate-500">
          {/* 여기에는 장치 온라인 여부, 마지막 heartbeat, 지점별 장치 목록이 들어가면 된다. */}
        </p>
      </div>
    </AdminShell>
  );
}
