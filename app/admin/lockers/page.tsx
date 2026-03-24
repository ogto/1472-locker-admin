"use client";

import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useRecentLockers } from "@/hooks/use-recent-lockers";
import { useLockerOpen } from "@/hooks/use-locker-open";

import { LoginCard } from "@/components/auth/login-card";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminHeader } from "@/components/admin/admin-header";
import { StatusBanner } from "@/components/admin/status-banner";

import { LockerHero } from "@/components/lockers/locker-hero";
import { LockerOpenForm } from "@/components/lockers/locker-open-form";
import { LockerResultPanel } from "@/components/lockers/locker-result-panel";
import { ConfirmOpenModal } from "@/components/lockers/confirm-open-modal";

export default function AdminLockersPage() {
  const auth = useAdminAuth();
  const recent = useRecentLockers();
  const locker = useLockerOpen(recent.pushRecentStorage, () => auth.setAuthenticated(false));

  if (auth.booting) {
    return (
      <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#ffe4f1_0%,#fff4fa_35%,#f8fbff_100%)] px-4">
        <div className="rounded-full bg-white px-5 py-3 text-base font-black text-slate-800 shadow sm:text-lg">
          불러오는 중...
        </div>
      </div>
    );
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

  const finalStorageId =
    locker.selectedStorageId ?? (locker.storageInput ? Number(locker.storageInput) : null);

  return (
    <>
      <AdminShell role={auth.role}>
        <AdminHeader
          title="보관함 제어"
          description="보관함 번호를 입력하고 수동 오픈 명령을 생성합니다."
          onLogout={auth.handleLogout}
        />

        {/* 상단 카드 영역 */}
        <div className="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <LockerHero />

          <section className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-[0_20px_50px_rgba(255,182,193,0.12)] backdrop-blur sm:p-6">
            <div className="space-y-3">
              <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm">
                <span className="text-slate-500">대상 API</span>
                <strong className="ml-3 text-slate-900">lock-command</strong>
              </div>
              <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm">
                <span className="text-slate-500">지원 지점</span>
                <strong className="ml-3 text-slate-900">꿈돌이 빵다방</strong>
              </div>
              <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm">
                <span className="text-slate-500">보관함 범위</span>
                <strong className="ml-3 text-slate-900">1 ~ 320</strong>
              </div>
            </div>
          </section>
        </div>

        {/* 본문 영역 */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:mt-6 lg:gap-6 xl:grid-cols-[400px_minmax(0,1fr)]">
          <LockerOpenForm
            point={locker.point}
            setPoint={locker.setPoint}
            storageInput={locker.storageInput}
            setStorageInput={locker.setStorageInput}
            pulseMs={locker.pulseMs}
            setPulseMs={locker.setPulseMs}
            selectedMeta={locker.selectedMeta}
            recentStorageIds={recent.recentStorageIds}
            onRecentClick={locker.handleRecentClick}
            onOpenClick={locker.handleOpenClick}
            onReset={locker.resetAll}
            clearStatus={locker.clearStatus}
          />

          <section className="space-y-4 lg:space-y-6">
            {locker.statusType ? (
              <StatusBanner type={locker.statusType} text={locker.statusText} />
            ) : null}

            <LockerResultPanel resultText={locker.resultText} />
          </section>
        </div>
      </AdminShell>

      <ConfirmOpenModal
        open={locker.confirmOpen}
        point={locker.point}
        storageId={finalStorageId}
        pulseMs={locker.pulseMs}
        submitting={locker.submitting}
        onClose={() => locker.setConfirmOpen(false)}
        onConfirm={locker.requestLockCommand}
      />
    </>
  );
}