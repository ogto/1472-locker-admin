type DisabledStorageItem = {
  storageId: number;
};

export const COLD_ASSIGNMENT_GROUPS = [
  "1",
  "2-1",
  "2-2",
  "3-1",
  "3-2",
  "3-3",
] as const;

export type ColdAssignmentGroupId = (typeof COLD_ASSIGNMENT_GROUPS)[number];

export const DEFAULT_COLD_ASSIGNMENT_ORDER: ColdAssignmentGroupId[] = [
  ...COLD_ASSIGNMENT_GROUPS,
];

export type AssignmentConfig = {
  assignmentOrder: ColdAssignmentGroupId[];
  disabledGroups: ColdAssignmentGroupId[];
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

function isColdAssignmentGroupId(value: unknown): value is ColdAssignmentGroupId {
  return (
    typeof value === "string" &&
    COLD_ASSIGNMENT_GROUPS.includes(value as ColdAssignmentGroupId)
  );
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
    "assignmentOrderList" in source ||
    "assignmentOrder" in source ||
    "disabledGroupList" in source ||
    "disabledGroups" in source ||
    "memo" in source;

  if (!hasConfigValue && fallback) {
    return fallback;
  }

  const assignmentOrder = parseAssignmentOrder(
    source.assignmentOrderList ?? source.assignmentOrder,
    fallback?.assignmentOrder ?? DEFAULT_COLD_ASSIGNMENT_ORDER
  );
  const disabledGroups = parseDisabledGroups(
    source.disabledGroupList ?? source.disabledGroups,
    fallback?.disabledGroups ?? []
  );

  return {
    assignmentOrder,
    disabledGroups,
    memo: typeof source.memo === "string" ? source.memo : fallback?.memo ?? "",
  };
}

function parseAssignmentOrder(
  value: unknown,
  fallback: ColdAssignmentGroupId[]
): ColdAssignmentGroupId[] {
  if (!Array.isArray(value)) return [...fallback];

  const groups = value.filter(isColdAssignmentGroupId);
  const isCompleteOrder =
    groups.length === COLD_ASSIGNMENT_GROUPS.length &&
    new Set(groups).size === COLD_ASSIGNMENT_GROUPS.length &&
    COLD_ASSIGNMENT_GROUPS.every((groupId) => groups.includes(groupId));

  return isCompleteOrder ? groups : [...fallback];
}

function parseDisabledGroups(
  value: unknown,
  fallback: ColdAssignmentGroupId[]
): ColdAssignmentGroupId[] {
  if (!Array.isArray(value)) return [...fallback];

  return Array.from(new Set(value.filter(isColdAssignmentGroupId)));
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
