"use client";

import { useEffect, useMemo, useState } from "react";
import { LoginCard } from "@/components/auth/login-card";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminHeader } from "@/components/admin/admin-header";
import { StatusBanner } from "@/components/admin/status-banner";
import { ConfirmOpenModal } from "@/components/lockers/confirm-open-modal";
import { LockerStatusSection } from "@/components/locker-status/locker-status-section";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { fetchReserveUser } from "@/lib/dashboard/api";
import type { ReserveUserItem } from "@/lib/dashboard/types";
import { DEFAULT_POINT, DEFAULT_PULSE_MS } from "@/lib/lockers/constants";

const COLD_LOCKERS = Array.from({ length: 300 }, (_, index) => index + 1);
const ROOM_LOCKERS = Array.from({ length: 100 }, (_, index) => index + 301);

function extractStorageId(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    return Number.isInteger(parsed) ? parsed : null;
  }

  return null;
}

function extractOccupiedStorageIds(items: unknown[]): number[] {
  const ids = new Set<number>();

  for (const item of items) {
    const candidates: unknown[] = [];

    if (typeof item === "number" || typeof item === "string") {
      candidates.push(item);
    }

    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      candidates.push(
        record.storageId,
        record.storageNo,
        record.storageNumber,
        record.lockerId,
        record.lockerNo,
        record.no
      );
    }

    for (const candidate of candidates) {
      const storageId = extractStorageId(candidate);

      if (storageId != null && storageId >= 1 && storageId <= 400) {
        ids.add(storageId);
      }
    }
  }

  return Array.from(ids);
}

function buildOccupiedMap(storageIds: number[], reserveUsers: ReserveUserItem[]) {
  const map = new Map<number, ReserveUserItem>();
  const reserveUserMap = new Map<number, ReserveUserItem>();

  for (const item of reserveUsers) {
    const storageId = Number(item.storageId);

    if (!Number.isInteger(storageId) || storageId < 1 || storageId > 400) {
      continue;
    }

    reserveUserMap.set(storageId, item);
  }

  for (const storageId of storageIds) {
    map.set(storageId, reserveUserMap.get(storageId) ?? ({ storageId } as ReserveUserItem));
  }

  return map;
}

export default function AdminLockerStatusPage() {
  const auth = useAdminAuth();
  const [reserveUsers, setReserveUsers] = useState<ReserveUserItem[]>([]);
  const [occupiedStorageIds, setOccupiedStorageIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedLockerId, setSelectedLockerId] = useState<number | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (!auth.booting && auth.authenticated) {
      void loadLockerStatus();
    }
  }, [auth.authenticated, auth.booting]);

  async function loadLockerStatus() {
    setLoading(true);
    setErrorText("");

    try {
      const [enableStorageResult, reserveUserResult] = await Promise.allSettled([
        fetch("/api/dashboard/enable-storage", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
        }),
        fetchReserveUser(),
      ]);

      let nextOccupiedStorageIds: number[] = [];

      if (enableStorageResult.status === "fulfilled") {
        const response = enableStorageResult.value;
        const data = await response.json();

        if (!response.ok || !data?.ok) {
          throw new Error(data?.message || "사용중 보관함 조회 실패");
        }

        const rawItems = Array.isArray(data.data) ? data.data : [];
        nextOccupiedStorageIds = extractOccupiedStorageIds(rawItems);
      } else {
        throw enableStorageResult.reason;
      }

      if (reserveUserResult.status === "fulfilled") {
        setReserveUsers(reserveUserResult.value.items);
      } else {
        setReserveUsers([]);
      }

      setOccupiedStorageIds(nextOccupiedStorageIds);
    } catch (error) {
      setReserveUsers([]);
      setOccupiedStorageIds([]);
      setErrorText(
        error instanceof Error ? error.message : "보관함 상태를 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleLockerClick(lockerNumber: number) {
    setSelectedLockerId(lockerNumber);
    setConfirmOpen(true);
    setErrorText("");
    setSuccessText("");
  }

  async function handleConfirmOpen() {
    if (selectedLockerId == null) return;

    setSubmitLoading(true);
    setErrorText("");
    setSuccessText("");

    try {
      const res = await fetch("/api/lock-command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          point: DEFAULT_POINT,
          storageId: selectedLockerId,
          pulseMs: DEFAULT_PULSE_MS,
          requestedBy: "admin-web-locker-status",
          requestNote: `보관함 관리 화면에서 수동 오픈 (${selectedLockerId}번)`,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || data?.detail || "보관함 열기에 실패했습니다.");
      }

      setSuccessText(`${selectedLockerId}번 보관함을 500ms로 열었습니다.`);
      setConfirmOpen(false);
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "보관함 열기에 실패했습니다."
      );
    } finally {
      setSubmitLoading(false);
    }
  }

  const occupiedMap = useMemo(
    () => buildOccupiedMap(occupiedStorageIds, reserveUsers),
    [occupiedStorageIds, reserveUsers]
  );
  const coldOccupiedCount = useMemo(
    () => COLD_LOCKERS.filter((lockerNumber) => occupiedMap.has(lockerNumber)).length,
    [occupiedMap]
  );
  const roomOccupiedCount = useMemo(
    () => ROOM_LOCKERS.filter((lockerNumber) => occupiedMap.has(lockerNumber)).length,
    [occupiedMap]
  );

  if (auth.booting) {
    return (
      <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#ffe4f1_0%,#fff4fa_35%,#f8fbff_100%)] px-4">
        <div className="rounded-full bg-white px-6 py-3 text-lg font-black text-slate-800 shadow">
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

  return (
    <AdminShell role={auth.role}>
      <AdminHeader
        title="보관함 관리"
        onLogout={auth.handleLogout}
      />

      <div className="space-y-4 lg:space-y-6">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={loadLockerStatus}
            disabled={loading}
            className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm font-black text-slate-900 shadow-sm transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? "조회 중..." : "새로고침"}
          </button>
        </div>

        {errorText ? <StatusBanner type="error" text={errorText} /> : null}
        {successText ? <StatusBanner type="ok" text={successText} /> : null}

        <LockerStatusSection
          title="냉장"
          description="1 ~ 300"
          occupiedCount={coldOccupiedCount}
          totalCount={COLD_LOCKERS.length}
          tone="cold"
          lockers={COLD_LOCKERS}
          occupiedMap={occupiedMap}
          onLockerClick={handleLockerClick}
        />

        <LockerStatusSection
          title="상온"
          description="301 ~ 400"
          occupiedCount={roomOccupiedCount}
          totalCount={ROOM_LOCKERS.length}
          tone="room"
          lockers={ROOM_LOCKERS}
          occupiedMap={occupiedMap}
          onLockerClick={handleLockerClick}
        />
      </div>

      <ConfirmOpenModal
        open={confirmOpen}
        point={DEFAULT_POINT}
        storageId={selectedLockerId}
        pulseMs={DEFAULT_PULSE_MS}
        submitting={submitLoading}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleConfirmOpen()}
      />
    </AdminShell>
  );
}
