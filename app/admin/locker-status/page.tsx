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
import { fetchTodayHistoryByStorage } from "@/lib/history/api";
import type { HistoryItem } from "@/lib/history/types";
import type { ReserveUserItem } from "@/lib/dashboard/types";
import { DEFAULT_POINT, DEFAULT_PULSE_MS } from "@/lib/lockers/constants";
import { formatChannel, formatReservationDate, formatStatus } from "@/lib/common";

const COLD_LOCKERS = Array.from({ length: 300 }, (_, index) => index + 1);
const ROOM_LOCKERS = Array.from({ length: 100 }, (_, index) => index + 301);

type LockerOccupantInfo = {
  name: string;
  tel: string;
  channel: string;
  reservationDate: string;
  status: string;
};

type LockerHistoryRow = {
  id: number;
  name: string;
  tel: string;
  timeRange: string;
  status: string;
};

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

function pickText(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function buildReserveUserInfo(item: ReserveUserItem): LockerOccupantInfo {
  return {
    name: item.mberNm?.trim() || "-",
    tel: item.tel?.trim() || "-",
    channel: formatChannel(item.os),
    reservationDate: formatReservationDate(item.reservationDay, item.reservationStartTime),
    status: formatStatus(item.reservationStatus),
  };
}

function buildEnableStorageInfo(record: Record<string, unknown>): LockerOccupantInfo {
  const reservationDay = pickText(record, ["reservationDay", "reserveDay", "day"]);
  const reservationStartTime = pickText(record, [
    "reservationStartTime",
    "reserveStartTime",
    "startTime",
    "time",
  ]);

  return {
    name: pickText(record, ["mberNm", "memberName", "userName", "name"]) || "-",
    tel: pickText(record, ["tel", "phone", "phoneNumber", "mobile"]) || "-",
    channel:
      formatChannel(
        pickText(record, ["os", "channel", "platform", "requestChannel"]) || "-"
      ) || "-",
    reservationDate: formatReservationDate(reservationDay, reservationStartTime),
    status: formatStatus(
      pickText(record, ["reservationStatus", "status", "reserveStatus"]) || "-"
    ),
  };
}

function buildOccupiedMap(
  enableStorageItems: unknown[],
  reserveUsers: ReserveUserItem[]
) {
  const map = new Map<number, LockerOccupantInfo | null>();
  const reserveUserMap = new Map<number, LockerOccupantInfo>();

  for (const item of reserveUsers) {
    const storageId = Number(item.storageId);

    if (!Number.isInteger(storageId) || storageId < 1 || storageId > 400) {
      continue;
    }

    reserveUserMap.set(storageId, buildReserveUserInfo(item));
  }

  for (const item of enableStorageItems) {
    const record =
      item && typeof item === "object" ? (item as Record<string, unknown>) : null;

    const storageId = extractStorageId(
      record?.storageId ??
        record?.storageNo ??
        record?.storageNumber ??
        record?.lockerId ??
        record?.lockerNo ??
        record?.no ??
        item
    );

    if (storageId == null || storageId < 1 || storageId > 400) {
      continue;
    }

    map.set(
      storageId,
      reserveUserMap.get(storageId) ?? (record ? buildEnableStorageInfo(record) : null)
    );
  }

  return map;
}

export default function AdminLockerStatusPage() {
  const auth = useAdminAuth();
  const [reserveUsers, setReserveUsers] = useState<ReserveUserItem[]>([]);
  const [enableStorageItems, setEnableStorageItems] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedLockerId, setSelectedLockerId] = useState<number | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyRows, setHistoryRows] = useState<LockerHistoryRow[]>([]);

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

      if (enableStorageResult.status === "fulfilled") {
        const response = enableStorageResult.value;
        const data = await response.json();

        if (!response.ok || !data?.ok) {
          throw new Error(data?.message || "사용중 보관함 조회 실패");
        }

        const rawItems = Array.isArray(data.data) ? data.data : [];
        setEnableStorageItems(rawItems);
      } else {
        throw enableStorageResult.reason;
      }

      if (reserveUserResult.status === "fulfilled") {
        setReserveUsers(reserveUserResult.value.items);
      } else {
        setReserveUsers([]);
      }
    } catch (error) {
      setReserveUsers([]);
      setEnableStorageItems([]);
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
    setHistoryRows([]);
    setHistoryError("");
    void loadLockerHistory(lockerNumber);
  }

  function buildHistoryTimeRange(item: HistoryItem) {
    const day = item.reservationDay?.trim() || "";
    const start = item.reservationStartTime?.trim() || "";
    const status = item.reservationStatus?.trim().toUpperCase() || "";

    if (!day || !start) return "-";

    if (status === "COMPLETED") {
      return `${start} ~ -`;
    }

    const updateAt = item.updateAt;

    if (Array.isArray(updateAt) && updateAt.length >= 5) {
      const [, , , hour, minute] = updateAt;
      const endText = `${String(Number(hour) || 0).padStart(2, "0")}:${String(
        Number(minute) || 0
      ).padStart(2, "0")}`;

      return `${start} ~ ${endText}`;
    }

    if (typeof updateAt === "string" && updateAt.trim()) {
      const parsed = new Date(updateAt);

      if (!Number.isNaN(parsed.getTime())) {
        const endText = `${String(parsed.getHours()).padStart(2, "0")}:${String(
          parsed.getMinutes()
        ).padStart(2, "0")}`;

        return `${start} ~ ${endText}`;
      }
    }

    return `${start} ~ -`;
  }

  function buildCurrentUserTimeRange(reservationDate?: string) {
    const text = reservationDate?.trim() || "";
    const match = text.match(/(\d{2}:\d{2})$/);

    if (!match) return "-";

    return `${match[1]} ~ -`;
  }

  async function loadLockerHistory(lockerNumber: number) {
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const collected = await fetchTodayHistoryByStorage(DEFAULT_POINT, lockerNumber);

      const mappedRows = collected.map((item) => ({
          id: item.id,
          name: item.mberNm?.trim() || "-",
          tel: item.tel?.trim() || "-",
          timeRange: buildHistoryTimeRange(item),
          status: formatStatus(item.reservationStatus),
        }));

      const currentUser = occupiedMap.get(lockerNumber);
      const hasCurrentUserRow =
        currentUser == null
          ? true
          : mappedRows.some(
              (row) =>
                row.tel === currentUser.tel &&
                row.name === currentUser.name &&
                (row.status === "이용중" || row.status === "보관중")
            );

      setHistoryRows(
        hasCurrentUserRow || !currentUser
          ? mappedRows
          : [
              {
                id: -lockerNumber,
                name: currentUser.name,
                tel: currentUser.tel,
                timeRange: buildCurrentUserTimeRange(currentUser.reservationDate),
                status: "이용중",
              },
              ...mappedRows,
            ]
      );
    } catch (error) {
      setHistoryRows([]);
      setHistoryError(
        error instanceof Error ? error.message : "히스토리 조회에 실패했습니다."
      );
    } finally {
      setHistoryLoading(false);
    }
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
    () => buildOccupiedMap(enableStorageItems, reserveUsers),
    [enableStorageItems, reserveUsers]
  );
  const selectedUserInfo = useMemo(() => {
    if (selectedLockerId == null) return null;
    return occupiedMap.get(selectedLockerId) ?? null;
  }, [occupiedMap, selectedLockerId]);
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
        userInfo={selectedUserInfo}
        historyLoading={historyLoading}
        historyError={historyError}
        historyRows={historyRows}
        onClose={() => {
          setConfirmOpen(false);
          setHistoryRows([]);
          setHistoryError("");
        }}
        onConfirm={() => void handleConfirmOpen()}
      />
    </AdminShell>
  );
}
