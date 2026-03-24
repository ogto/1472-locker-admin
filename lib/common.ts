export function formatPrice(value?: number | null) {
  return `${(value ?? 0).toLocaleString()}원`;
}

export function formatReservationDate(day?: string | null, startTime?: string | null) {
  const safeDay = (day || "").trim();
  const safeStartTime = (startTime || "").trim();

  if (!safeDay || safeDay === "-") return "-";
  if (!safeStartTime || safeStartTime === "-") return safeDay;

  return `${safeDay} ${safeStartTime}`;
}

export function formatChannel(os?: string | null) {
  const raw = os ?? "";
  const normalized = raw.trim().toLowerCase();

  if (!normalized) return "-";

  if (normalized.includes("kiosk")) {
    return "키오스크";
  }

  if (
    normalized.includes("android") ||
    normalized.includes("ios") ||
    normalized.includes("app")
  ) {
    return "앱";
  }

  return raw || "-";
}

export function formatStatus(status?: string | null) {
  const normalized = (status || "").trim().toUpperCase();

  if (!normalized) return "-";

  switch (normalized) {
    case "COMPLETED":
      return "보관중";
    case "RESERVED":
      return "예약";
    case "PENDING":
      return "대기";
    case "READY":
      return "찾기대기";
    case "PICKUP":
      return "픽업완료";
    case "CANCEL":
    case "CANCELLED":
      return "취소";
    default:
      return status || "-";
  }
}

export function formatStorageType(type?: number | null) {
  if (type === 0) return "냉장";
  if (type === 1) return "상온";
  if (type === 2) return "캐리어";
  return "-";
}