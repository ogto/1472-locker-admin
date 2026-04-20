type DisabledStorageItem = {
  storageId: number;
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
