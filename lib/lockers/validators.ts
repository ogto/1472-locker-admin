import { DEFAULT_POINT, MAX_LOCKERS } from "@/lib/lockers/constants";

export function sanitizeNumericInput(value: string) {
  return value.replace(/[^0-9]/g, "").slice(0, 4);
}

export function parseValidStorageId(value: string) {
  const no = Number(value);
  if (!Number.isInteger(no) || no < 1 || no > MAX_LOCKERS) return null;
  return no;
}

export function validateLockerOpen(params: {
  point: string;
  storageInput: string;
  selectedStorageId: number | null;
  pulseMs: number;
}) {
  const { point, storageInput, selectedStorageId, pulseMs } = params;

  if (!point) {
    return { ok: false as const, message: "지점 값이 비어 있습니다." };
  }

  if (point !== DEFAULT_POINT) {
    return { ok: false as const, message: "현재는 bank 지점만 지원합니다." };
  }

  const parsedInput = parseValidStorageId(storageInput);

  if (parsedInput == null) {
    return { ok: false as const, message: `보관함 번호는 1부터 ${MAX_LOCKERS}까지 입력해야 합니다.` };
  }

  if (selectedStorageId != null && selectedStorageId !== parsedInput) {
    return { ok: false as const, message: "선택된 보관함 번호와 입력값이 다릅니다." };
  }

  if (!Number.isInteger(pulseMs) || pulseMs < 100 || pulseMs > 10000) {
    return { ok: false as const, message: "열림 시간은 100ms ~ 10000ms 범위여야 합니다." };
  }

  return {
    ok: true as const,
    storageId: parsedInput,
  };
}