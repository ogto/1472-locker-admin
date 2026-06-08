type DisabledStorageItem = {
  storageId: number;
};

export type AssignmentConfig = {
  startGroup: number;
  disabledGroups: number[];
  memo: string;
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

function extractNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeAssignmentConfig(
  value: unknown,
  fallback?: AssignmentConfig
): AssignmentConfig {
  const record =
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const source =
    record.data && typeof record.data === "object"
      ? (record.data as Record<string, unknown>)
      : record;
  const hasConfigValue =
    "startGroup" in source || "disabledGroups" in source || "memo" in source;

  if (!hasConfigValue && fallback) {
    return fallback;
  }

  const disabledGroupsRaw = source.disabledGroupList ?? source.disabledGroups;
  const disabledGroups = parseAssignmentGroups(disabledGroupsRaw, fallback);

  return {
    startGroup: extractNumber(source.startGroup) ?? fallback?.startGroup ?? 1,
    disabledGroups,
    memo: typeof source.memo === "string" ? source.memo : fallback?.memo ?? "",
  };
}

function parseAssignmentGroups(
  value: unknown,
  fallback?: AssignmentConfig
): number[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => extractNumber(item))
      .filter((item): item is number => item != null && Number.isInteger(item));
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(/[,\s]+/)
      .map((item) => extractNumber(item))
      .filter((item): item is number => item != null && Number.isInteger(item));
  }

  return fallback?.disabledGroups ?? [];
}

export async function fetchDisabledStorages(): Promise<DisabledStorageItem[]> {
  const response = await fetch("/api/lockers/disabled-storage", {
    method: "GET",
    cache: "no-store",
  });

  const result = await response.json();

  if (!response.ok || !result?.ok) {
    throw new Error(result?.message || "사용불가 보관함 조회에 실패했습니다.");
  }

  const items: unknown[] = Array.isArray(result?.data) ? result.data : [];

  return items
    .map((item) => {
      const record =
        item && typeof item === "object" ? (item as Record<string, unknown>) : null;

      const storageId = extractStorageId(
        record?.storageId ?? record?.storageNo ?? record?.lockerId ?? record?.id ?? item
      );

      if (storageId == null) return null;

      return { storageId };
    })
    .filter((item): item is DisabledStorageItem => item != null);
}

export async function disableStorage(storageId: number) {
  const response = await fetch(`/api/lockers/disabled-storage/${storageId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  const result = await response.json().catch(() => null);

  if (!response.ok || !result?.ok) {
    throw new Error(result?.message || "사용불가 설정에 실패했습니다.");
  }

  return result?.data ?? null;
}

export async function enableStorage(storageId: number) {
  const response = await fetch(`/api/lockers/disabled-storage/${storageId}`, {
    method: "DELETE",
  });

  const result = await response.json().catch(() => null);

  if (!response.ok || (result && !result.ok)) {
    throw new Error(result?.message || "사용불가 해제에 실패했습니다.");
  }
}

export async function fetchColdAssignmentConfig(): Promise<AssignmentConfig> {
  const response = await fetch("/api/lockers/assignment-config/cold", {
    method: "GET",
    cache: "no-store",
  });

  const result = await response.json().catch(() => null);

  if (!response.ok || !result?.ok) {
    throw new Error(result?.message || "그룹 배정 설정 조회에 실패했습니다.");
  }

  return normalizeAssignmentConfig(result?.data);
}

export async function saveColdAssignmentConfig(
  config: AssignmentConfig
): Promise<AssignmentConfig> {
  const response = await fetch("/api/lockers/assignment-config/cold", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(config),
  });

  const result = await response.json().catch(() => null);

  if (!response.ok || !result?.ok) {
    throw new Error(result?.message || "그룹 배정 설정 저장에 실패했습니다.");
  }

  return normalizeAssignmentConfig(result?.data, config);
}
