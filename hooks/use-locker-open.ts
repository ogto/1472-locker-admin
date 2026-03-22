"use client";

import { useMemo, useState } from "react";
import type { ApiResponse, StatusType } from "@/lib/admin/types";
import {
  DEFAULT_POINT,
  DEFAULT_PULSE_MS,
  MAX_LOCKERS,
} from "@/lib/lockers/constants";
import {
  calcDeviceNo,
  calcLockerNo,
} from "@/lib/lockers/mapping";
import { parseValidStorageId, validateLockerOpen } from "@/lib/lockers/validators";

export function useLockerOpen(
  pushRecentStorage: (no: number) => void,
  onUnauthorized?: () => void
) {
  const [point, setPoint] = useState(DEFAULT_POINT);
  const [storageInput, setStorageInput] = useState("");
  const [pulseMs, setPulseMs] = useState(DEFAULT_PULSE_MS);
  const [selectedStorageId, setSelectedStorageId] = useState<number | null>(null);

  const [statusType, setStatusType] = useState<StatusType>("");
  const [statusText, setStatusText] = useState("");
  const [resultText, setResultText] = useState("아직 요청 없음.");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function setStatus(type: Exclude<StatusType, "">, text: string) {
    setStatusType(type);
    setStatusText(text);
  }

  function clearStatus() {
    setStatusType("");
    setStatusText("");
  }

  function resetAll() {
    setPoint(DEFAULT_POINT);
    setStorageInput("");
    setPulseMs(DEFAULT_PULSE_MS);
    setSelectedStorageId(null);
    clearStatus();
    setResultText("아직 요청 없음.");
    setConfirmOpen(false);
  }

  function handleRecentClick(no: number) {
    clearStatus();
    setStorageInput(String(no));
    setSelectedStorageId(no);
  }

  function handleOpenClick() {
    clearStatus();

    const checked = validateLockerOpen({
      point,
      storageInput,
      selectedStorageId,
      pulseMs,
    });

    if (!checked.ok) {
      setStatus("error", checked.message);
      return;
    }

    setSelectedStorageId(checked.storageId);
    setConfirmOpen(true);
  }

  async function requestLockCommand() {
    const targetStorageId = parseValidStorageId(storageInput);

    if (targetStorageId == null) {
      setStatus("error", `보관함 번호는 1부터 ${MAX_LOCKERS}까지 입력해야 합니다.`);
      return;
    }

    const payload = {
      point,
      storageId: targetStorageId,
      pulseMs,
      requestedBy: "admin-web",
      requestNote: `관리자 웹에서 수동 오픈 (${targetStorageId}번)`,
    };

    setSubmitting(true);
    setResultText("락 오픈 명령 생성 요청 전송 중...");

    try {
      const res = await fetch("/api/lock-command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      let data: ApiResponse;
      try {
        data = await res.json();
      } catch (jsonError) {
        data = {
          ok: false,
          message: "JSON 응답 파싱 실패",
          detail: jsonError instanceof Error ? jsonError.message : String(jsonError),
        };
      }

      setResultText(
        JSON.stringify(
          {
            request: payload,
            response: data,
          },
          null,
          2
        )
      );

      if (res.ok) {
        const bodyData = data?.data || data || {};
        const returnedStatus = bodyData?.status || data?.status || "PENDING";
        const returnedDeviceNo = bodyData?.deviceNo ?? calcDeviceNo(targetStorageId);
        const returnedLockerNo = bodyData?.lockerNo ?? calcLockerNo(targetStorageId);

        setSelectedStorageId(targetStorageId);
        pushRecentStorage(targetStorageId);

        setStatus(
          "ok",
          [
            `✨ ${targetStorageId}번 보관함 오픈 명령 생성 완료`,
            `status = ${returnedStatus}`,
            `deviceNo = ${returnedDeviceNo ?? "-"}`,
            `lockerNo = ${returnedLockerNo ?? "-"}`,
          ].join("\n")
        );
      } else {
        const message =
          data?.message ||
          data?.detail ||
          data?.data?.message ||
          data?.data?.error ||
          "요청 실패";

        setStatus(
          "error",
          [
            `⚠️ ${targetStorageId}번 보관함 오픈 명령 생성 실패`,
            `HTTP status = ${res.status}`,
            `message = ${message}`,
          ].join("\n")
        );

        if (res.status === 401) {
          onUnauthorized?.();
        }
      }
    } catch (error) {
      setResultText(
        JSON.stringify(
          {
            request: payload,
            ok: false,
            message: "브라우저 요청 오류",
            detail: error instanceof Error ? error.message : String(error),
          },
          null,
          2
        )
      );

      setStatus(
        "error",
        [
          `⚠️ ${targetStorageId}번 보관함 오픈 명령 생성 실패`,
          "브라우저 요청 중 오류가 발생했습니다.",
          error instanceof Error ? error.message : String(error),
        ].join("\n")
      );
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  }

  const selectedMeta = useMemo(() => {
    const target = selectedStorageId ?? Number(storageInput);

    if (!Number.isInteger(target) || target < 1 || target > MAX_LOCKERS) {
      return {
        value: "선택 안됨",
        helper: "1~320 사이 보관함 번호를 입력하세요.",
      };
    }

    const deviceNo = calcDeviceNo(target);
    const lockerNo = calcLockerNo(target);

    return {
      value: `${target}번 보관함`,
      helper:
        deviceNo && lockerNo
          ? `deviceNo ${deviceNo} · lockerNo ${lockerNo}`
          : "매핑 정보 없음",
    };
  }, [selectedStorageId, storageInput]);

  return {
    point,
    setPoint,
    storageInput,
    setStorageInput,
    pulseMs,
    setPulseMs,
    selectedStorageId,
    setSelectedStorageId,
    statusType,
    statusText,
    resultText,
    confirmOpen,
    setConfirmOpen,
    submitting,
    selectedMeta,
    clearStatus,
    resetAll,
    handleRecentClick,
    handleOpenClick,
    requestLockCommand,
  };
}