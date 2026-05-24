"use client";

import { useEffect, useMemo, useState } from "react";
import { LoginCard } from "@/components/auth/login-card";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminHeader } from "@/components/admin/admin-header";
import { StatusBanner } from "@/components/admin/status-banner";
import { ConfirmOpenModal } from "@/components/lockers/confirm-open-modal";
import { LockerStatusSection } from "@/components/locker-status/locker-status-section";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { fetchReserveUser, postPickup } from "@/lib/dashboard/api";
import { fetchTodayHistoryByStorage } from "@/lib/history/api";
import {
  disableStorage,
  enableStorage,
  fetchDisabledStorages,
} from "@/lib/lockers/api";
import type { HistoryItem } from "@/lib/history/types";
import type { ReserveUserItem } from "@/lib/dashboard/types";
import {
  DEFAULT_POINT,
  DEFAULT_PULSE_MS,
  MAX_DEVICE_NO,
} from "@/lib/lockers/constants";
import { DEVICE_RANGES } from "@/lib/lockers/mapping";
import {
  formatChannel,
  formatReservationDate,
  formatStatus,
} from "@/lib/common";

const COLD_LOCKERS = Array.from({ length: 300 }, (_, index) => index + 1);
const ROOM_LOCKERS = Array.from({ length: 100 }, (_, index) => index + 301);
const STATUS_MAX_LOCKER = 400;
const ESP_OPEN_DELAY_MS = 150;

type LockerOccupantInfo = {
  name: string;
  tel: string;
  channel: string;
  reservationDate: string;
  statusCode: string;
  status: string;
  visitText: string;
  pickupProduct: boolean;
};

type LockerHistoryRow = {
  id: number;
  name: string;
  tel: string;
  timeRange: string;
  status: string;
};

type PickupTarget = {
  id: number;
  point: string;
  reserveId: number;
  addPay: number;
  addPayTof: boolean | null;
};

type EspOpenResult = {
  storageId: number;
  ok: boolean;
  message: string;
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

function pickNumber(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value.trim());
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function pickBoolean(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const normalized = value.trim().toLowerCase();
      if (normalized === "true") return true;
      if (normalized === "false") return false;
    }
  }

  return null;
}

function readRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function pickHistoryId(record: Record<string, unknown>) {
  return pickNumber(record, [
    "id",
    "historyId",
    "reserveHistoryId",
    "breadStorageHistoryId",
    "storageHistoryId",
  ]);
}

function pickReserveId(record: Record<string, unknown>) {
  return pickNumber(record, [
    "reserveId",
    "reservationId",
    "reservationNo",
    "reserveNo",
  ]);
}

function formatVisitText(visitSeq?: number | null) {
  return visitSeq && visitSeq > 0 ? `${visitSeq}번째 방문` : "-";
}

function normalizeStatusCode(status?: string | null) {
  return (status || "").trim().toUpperCase();
}

function buildReserveUserInfo(item: ReserveUserItem): LockerOccupantInfo {
  const statusCode = normalizeStatusCode(item.reservationStatus);

  return {
    name: item.mberNm?.trim() || "-",
    tel: item.tel?.trim() || "-",
    channel: formatChannel(item.os),
    reservationDate: formatReservationDate(item.reservationDay, item.reservationStartTime),
    statusCode,
    status: formatStatus(item.reservationStatus),
    visitText: formatVisitText(item.visitSeq),
    pickupProduct: item.pickupProduct === true,
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
  const statusCode = normalizeStatusCode(
    pickText(record, ["reservationStatus", "status", "reserveStatus"]) || "-"
  );

  return {
    name: pickText(record, ["mberNm", "memberName", "userName", "name"]) || "-",
    tel: pickText(record, ["tel", "phone", "phoneNumber", "mobile"]) || "-",
    channel:
      formatChannel(
        pickText(record, ["os", "channel", "platform", "requestChannel"]) || "-"
      ) || "-",
    reservationDate: formatReservationDate(reservationDay, reservationStartTime),
    statusCode,
    status: formatStatus(statusCode),
    visitText: formatVisitText(
      pickNumber(record, ["visitSeq", "visitCount", "visitNo", "sequence"])
    ),
    pickupProduct: pickBoolean(record, ["pickupProduct"]) === true,
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
    map.set(storageId, reserveUserMap.get(storageId) ?? null);
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

    const reserveInfo = reserveUserMap.get(storageId);
    const enableInfo = record ? buildEnableStorageInfo(record) : null;

    map.set(
      storageId,
      reserveInfo && enableInfo
        ? {
            ...reserveInfo,
            pickupProduct: reserveInfo.pickupProduct || enableInfo.pickupProduct,
          }
        : reserveInfo ?? enableInfo
    );
  }

  return map;
}

function isPickupAvailableStatus(statusValue?: string | null) {
  const status = statusValue?.trim().toUpperCase() || "";

  return status !== "PICKUP" && status !== "CANCEL" && status !== "CANCELED";
}

function buildPickupTarget(record: Record<string, unknown>, point?: string | null) {
  const historyId = pickHistoryId(record);
  const reserveId = pickReserveId(record);

  if (historyId == null || reserveId == null) {
    return null;
  }

  return {
    id: historyId,
    point: point || pickText(record, ["point"]) || DEFAULT_POINT,
    reserveId,
    addPay: pickNumber(record, ["addPay", "additionalPay", "extraPay"]) ?? 0,
    addPayTof: pickBoolean(record, ["addPayTof", "additionalPayTof"]),
  };
}

function hasUnpaidAddPay(target: PickupTarget) {
  return target.addPay > 0 && target.addPayTof === false;
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function parseEspNo(value: string) {
  const parsed = Number(value.trim());
  return Number.isInteger(parsed) ? parsed : null;
}

function findStatusDeviceRange(deviceNo: number | null) {
  if (deviceNo == null) return null;

  const range = DEVICE_RANGES.find((item) => item.deviceNo === deviceNo);
  if (!range || range.start > STATUS_MAX_LOCKER) return null;

  return {
    ...range,
    end: Math.min(range.end, STATUS_MAX_LOCKER),
  };
}

function buildPickupTargets(
  selectedLockerId: number | null,
  reserveUsers: ReserveUserItem[],
  enableStorageItems: unknown[],
  selectedHistoryItems: HistoryItem[]
): PickupTarget[] {
  if (selectedLockerId == null) return [];

  const targetMap = new Map<number, PickupTarget>();

  for (const item of reserveUsers) {
    const record = readRecord(item);
    const storageId =
      pickNumber(record, ["storageId", "storageNo", "storageNumber"]) ??
      Number(item.storageId);
    const target = buildPickupTarget(record, item.point || DEFAULT_POINT);

    if (
      storageId === selectedLockerId &&
      target != null &&
      isPickupAvailableStatus(item.reservationStatus)
    ) {
      targetMap.set(target.id, target);
    }
  }

  for (const item of enableStorageItems) {
    const record = readRecord(item);
    const storageId = extractStorageId(
      record.storageId ??
        record.storageNo ??
        record.storageNumber ??
        record.lockerId ??
        record.lockerNo ??
        record.no
    );
    const status =
      pickText(record, ["reservationStatus", "status", "reserveStatus"]) || null;
    const target = buildPickupTarget(record);

    if (
      storageId === selectedLockerId &&
      target != null &&
      isPickupAvailableStatus(status)
    ) {
      targetMap.set(target.id, target);
    }
  }

  for (const item of selectedHistoryItems) {
    const record = readRecord(item);
    const target = buildPickupTarget(record, item.point || DEFAULT_POINT);

    if (
      target != null &&
      isPickupAvailableStatus(item.reservationStatus)
    ) {
      targetMap.set(target.id, target);
    }
  }

  return Array.from(targetMap.values());
}

export default function AdminLockerStatusPage() {
  const auth = useAdminAuth();
  const [reserveUsers, setReserveUsers] = useState<ReserveUserItem[]>([]);
  const [enableStorageItems, setEnableStorageItems] = useState<unknown[]>([]);
  const [disabledStorageIds, setDisabledStorageIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedLockerId, setSelectedLockerId] = useState<number | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [disabledSubmitLoading, setDisabledSubmitLoading] = useState(false);
  const [pickupSubmitLoading, setPickupSubmitLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyRows, setHistoryRows] = useState<LockerHistoryRow[]>([]);
  const [selectedHistoryItems, setSelectedHistoryItems] = useState<HistoryItem[]>([]);
  const [espInput, setEspInput] = useState("");
  const [confirmEspOpen, setConfirmEspOpen] = useState(false);
  const [espSubmitLoading, setEspSubmitLoading] = useState(false);
  const [espOpenResults, setEspOpenResults] = useState<EspOpenResult[]>([]);

  useEffect(() => {
    if (!auth.booting && auth.authenticated) {
      void loadLockerStatus();
    }
  }, [auth.authenticated, auth.booting]);

  async function loadLockerStatus() {
    setLoading(true);
    setErrorText("");

    try {
      const [
        enableStorageResult,
        reserveUserResult,
        disabledStorageResult,
      ] =
        await Promise.allSettled([
        fetch("/api/dashboard/enable-storage?point=bank", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
        }),
        fetchReserveUser(),
        fetchDisabledStorages(),
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

      if (disabledStorageResult.status === "fulfilled") {
        setDisabledStorageIds(disabledStorageResult.value.map((item) => item.storageId));
      } else {
        setDisabledStorageIds([]);
      }

    } catch (error) {
      setReserveUsers([]);
      setEnableStorageItems([]);
      setDisabledStorageIds([]);
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
    setSelectedHistoryItems([]);
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
      setSelectedHistoryItems(collected);

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
                (row.status === "이용중" ||
                  row.status === "보관중" ||
                  row.status === "찾기대기")
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
                status: currentUser.status || "이용중",
              },
              ...mappedRows,
            ]
      );
    } catch (error) {
      setHistoryRows([]);
      setSelectedHistoryItems([]);
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

  async function handleToggleDisabled() {
    if (selectedLockerId == null) return;

    const currentlyDisabled = disabledStorageSet.has(selectedLockerId);
    const confirmed = window.confirm(
      currentlyDisabled
        ? `${selectedLockerId}번 보관함을 사용가능으로 변경할까요?`
        : `${selectedLockerId}번 보관함을 사용불가로 설정할까요?`
    );

    if (!confirmed) return;

    setDisabledSubmitLoading(true);
    setErrorText("");
    setSuccessText("");

    try {
      if (currentlyDisabled) {
        await enableStorage(selectedLockerId);
        setDisabledStorageIds((prev) => prev.filter((id) => id !== selectedLockerId));
        setSuccessText(`${selectedLockerId}번 보관함을 사용가능으로 변경했습니다.`);
      } else {
        await disableStorage(selectedLockerId);
        setDisabledStorageIds((prev) =>
          prev.includes(selectedLockerId) ? prev : [...prev, selectedLockerId]
        );
        setSuccessText(`${selectedLockerId}번 보관함을 사용불가로 설정했습니다.`);
      }
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "사용불가 설정 변경에 실패했습니다."
      );
    } finally {
      setDisabledSubmitLoading(false);
    }
  }

  async function handlePickupCurrentUser() {
    const pickupTargets = buildPickupTargets(
      selectedLockerId,
      reserveUsers,
      enableStorageItems,
      selectedHistoryItems
    );

    if (selectedLockerId == null || !pickupTargets.length) {
      setErrorText("픽업완료 처리할 현재 이용자가 없습니다.");
      return;
    }

    const reserveId = pickupTargets[0].reserveId;

    if (reserveId == null) {
      setErrorText("픽업완료 처리할 예약번호가 없습니다.");
      return;
    }

    const confirmed = window.confirm(
      pickupTargets.length > 1
        ? `${selectedLockerId}번 보관함의 보관 건 ${pickupTargets.length}건만 픽업완료 처리할까요?`
        : `${selectedLockerId}번 보관함만 픽업완료 처리할까요?`
    );

    if (!confirmed) return;

    setPickupSubmitLoading(true);
    setErrorText("");
    setSuccessText("");

    try {
      await postPickup({
        historyIds: pickupTargets.map((item) => item.id),
        point: pickupTargets[0].point || DEFAULT_POINT,
        reserveId,
        force: true,
      });

      setSuccessText(`${selectedLockerId}번 보관함만 픽업완료 처리했습니다.`);
      setConfirmOpen(false);
      setHistoryRows([]);
      setSelectedHistoryItems([]);
      setHistoryError("");
      await loadLockerStatus();
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "픽업완료 처리에 실패했습니다."
      );
    } finally {
      setPickupSubmitLoading(false);
    }
  }

  function handleEspOpenClick() {
    const deviceNo = parseEspNo(espInput);
    const range = findStatusDeviceRange(deviceNo);

    setErrorText("");
    setSuccessText("");
    setEspOpenResults([]);

    if (deviceNo == null || deviceNo < 1 || deviceNo > MAX_DEVICE_NO) {
      setErrorText(`ESP 번호는 1부터 ${MAX_DEVICE_NO}까지 입력할 수 있습니다.`);
      return;
    }

    if (!range) {
      setErrorText(
        `ESP ${deviceNo}번에는 현재 매핑된 보관함이 없습니다. 37번은 295~300번을 사용하고, 38번은 사용하지 않으며, 39번부터 상온 301번 이후를 사용합니다.`
      );
      return;
    }

    setConfirmEspOpen(true);
  }

  async function handleConfirmEspOpen() {
    const deviceNo = parseEspNo(espInput);
    const range = findStatusDeviceRange(deviceNo);

    if (deviceNo == null || !range) return;

    const storageIds = Array.from(
      { length: range.end - range.start + 1 },
      (_, index) => range.start + index
    );
    const results: EspOpenResult[] = [];

    setEspSubmitLoading(true);
    setErrorText("");
    setSuccessText("");
    setEspOpenResults([]);

    try {
      for (const storageId of storageIds) {
        try {
          const res = await fetch("/api/lock-command", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "same-origin",
            body: JSON.stringify({
              point: DEFAULT_POINT,
              storageId,
              pulseMs: DEFAULT_PULSE_MS,
              requestedBy: "admin-web-locker-status",
              requestNote: `보관함 관리 화면에서 ESP ${deviceNo}번 전체 오픈 (${storageId}번)`,
            }),
          });

          const data = await res.json().catch(() => null);

          if (!res.ok || !data?.ok) {
            throw new Error(data?.message || data?.detail || "열기 실패");
          }

          results.push({ storageId, ok: true, message: "성공" });
        } catch (error) {
          results.push({
            storageId,
            ok: false,
            message: error instanceof Error ? error.message : "열기 실패",
          });
        }

        setEspOpenResults([...results]);

        if (storageId !== storageIds[storageIds.length - 1]) {
          await sleep(ESP_OPEN_DELAY_MS);
        }
      }

      const successCount = results.filter((item) => item.ok).length;
      const failCount = results.length - successCount;

      setSuccessText(
        `ESP ${deviceNo}번 보관함 ${successCount}개 열기 요청을 완료했습니다.${
          failCount > 0 ? ` 실패 ${failCount}개가 있습니다.` : ""
        }`
      );
    } finally {
      setEspSubmitLoading(false);
    }
  }

  const occupiedMap = useMemo(
    () => buildOccupiedMap(enableStorageItems, reserveUsers),
    [enableStorageItems, reserveUsers]
  );
  const disabledStorageSet = useMemo(
    () => new Set(disabledStorageIds),
    [disabledStorageIds]
  );
  const selectedUserInfo = useMemo(() => {
    if (selectedLockerId == null) return null;
    return occupiedMap.get(selectedLockerId) ?? null;
  }, [occupiedMap, selectedLockerId]);
  const selectedLockerDisabled = useMemo(() => {
    if (selectedLockerId == null) return false;
    return disabledStorageSet.has(selectedLockerId);
  }, [disabledStorageSet, selectedLockerId]);
  const selectedPickupTargets = useMemo(() => {
    return buildPickupTargets(
      selectedLockerId,
      reserveUsers,
      enableStorageItems,
      selectedHistoryItems
    );
  }, [enableStorageItems, reserveUsers, selectedHistoryItems, selectedLockerId]);
  const coldOccupiedCount = useMemo(
    () => COLD_LOCKERS.filter((lockerNumber) => occupiedMap.has(lockerNumber)).length,
    [occupiedMap]
  );
  const roomOccupiedCount = useMemo(
    () => ROOM_LOCKERS.filter((lockerNumber) => occupiedMap.has(lockerNumber)).length,
    [occupiedMap]
  );
  const selectedEspRange = useMemo(
    () => findStatusDeviceRange(parseEspNo(espInput)),
    [espInput]
  );
  const selectedEspStorageIds = useMemo(() => {
    if (!selectedEspRange) return [];

    return Array.from(
      { length: selectedEspRange.end - selectedEspRange.start + 1 },
      (_, index) => selectedEspRange.start + index
    );
  }, [selectedEspRange]);
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
    <AdminShell role={auth.role} onLogout={auth.handleLogout}>
      <AdminHeader
        title="보관함 관리"
        onLogout={auth.handleLogout}
      />

      <div className="space-y-4 lg:space-y-6">
        <div className="flex flex-col gap-3 rounded-[28px] border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-sm font-black text-slate-900">ESP 단위 열기</div>
            <div className="mt-1 text-xs font-bold text-slate-500">
              ESP 번호에 매핑된 보관함을 150ms 간격으로 순차 오픈합니다.
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="sr-only" htmlFor="esp-open-input">
              ESP 번호
            </label>
            <input
              id="esp-open-input"
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_DEVICE_NO}
              value={espInput}
              onChange={(event) => {
                setEspInput(event.target.value.replace(/[^\d]/g, ""));
                setEspOpenResults([]);
              }}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-900 outline-none transition focus:border-rose-200 focus:shadow-[0_0_0_6px_rgba(251,207,232,0.35)] sm:w-32"
              placeholder="ESP 번호"
            />
            <button
              type="button"
              onClick={handleEspOpenClick}
              disabled={espSubmitLoading}
              className="h-11 rounded-2xl bg-rose-500 px-4 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-rose-600 disabled:cursor-wait disabled:opacity-60"
            >
              ESP 전체 열기
            </button>
          </div>
        </div>

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
          disabledSet={disabledStorageSet}
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
          disabledSet={disabledStorageSet}
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
        disabled={selectedLockerDisabled}
        disableSubmitting={disabledSubmitLoading}
        pickupSubmitting={pickupSubmitLoading}
        canPickupCurrentUser={selectedPickupTargets.length > 0}
        pickupTargetCount={selectedPickupTargets.length}
        historyLoading={historyLoading}
        historyError={historyError}
        historyRows={historyRows}
        onClose={() => {
          setConfirmOpen(false);
          setHistoryRows([]);
          setSelectedHistoryItems([]);
          setHistoryError("");
        }}
        onConfirm={() => void handleConfirmOpen()}
        onToggleDisabled={() => void handleToggleDisabled()}
        onPickupCurrentUser={() => void handlePickupCurrentUser()}
      />

      {confirmEspOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.46)] p-4 backdrop-blur-[3px]"
          onClick={() => {
            if (!espSubmitLoading) setConfirmEspOpen(false);
          }}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="text-[22px] font-black tracking-[-0.03em] text-slate-900">
                ESP 전체 열기
              </div>
              <div className="mt-1 text-sm font-bold text-slate-500">
                ESP {parseEspNo(espInput) ?? "-"}번의 보관함{" "}
                {selectedEspRange
                  ? `${selectedEspRange.start}~${selectedEspRange.end}번`
                  : "-"}{" "}
                {selectedEspStorageIds.length}개를 순차로 엽니다.
              </div>
            </div>

            <div className="space-y-4 px-5 py-4 sm:px-6">
              <div className="rounded-3xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                한 번 실행하면 해당 ESP에 연결된 보관함이 모두 열립니다.
              </div>

              {espOpenResults.length > 0 ? (
                <div className="max-h-56 overflow-y-auto rounded-3xl border border-slate-100">
                  {espOpenResults.map((result) => (
                    <div
                      key={result.storageId}
                      className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5 text-sm last:border-b-0"
                    >
                      <span className="font-black text-slate-800">
                        {result.storageId}번
                      </span>
                      <span
                        className={[
                          "text-right font-bold",
                          result.ok ? "text-emerald-600" : "text-rose-600",
                        ].join(" ")}
                      >
                        {result.ok ? "성공" : result.message}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmEspOpen(false)}
                  disabled={espSubmitLoading}
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
                >
                  닫기
                </button>
                <button
                  type="button"
                  onClick={() => void handleConfirmEspOpen()}
                  disabled={espSubmitLoading || selectedEspStorageIds.length === 0}
                  className="h-11 rounded-2xl bg-slate-900 px-5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
                >
                  {espSubmitLoading ? "순차 열기 중..." : "실행"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
