import { MAX_DEVICE_NO, MAX_LOCKERS } from "@/lib/lockers/constants";

export type DeviceRange = {
  deviceNo: number;
  start: number;
  end: number;
};

export type LockerMapping = {
  deviceNo: number;
  lockerNo: number;
};

function buildDeviceRanges(): DeviceRange[] {
  const ranges: DeviceRange[] = [];

  // 1 ~ 37번 ESP: 각 8개씩
  for (let deviceNo = 1; deviceNo <= 37; deviceNo += 1) {
    const start = (deviceNo - 1) * 8 + 1;
    const end = start + 7;

    ranges.push({
      deviceNo,
      start,
      end: Math.min(end, MAX_LOCKERS),
    });
  }

  // 38번 ESP: 예외적으로 297 ~ 300만 사용
  ranges.push({
    deviceNo: 38,
    start: 297,
    end: Math.min(300, MAX_LOCKERS),
  });

  // 39번 ESP부터 다시 8개씩 정상 배치
  let currentStart = 301;

  for (let deviceNo = 39; deviceNo <= MAX_DEVICE_NO; deviceNo += 1) {
    if (currentStart > MAX_LOCKERS) break;

    const end = Math.min(currentStart + 7, MAX_LOCKERS);

    ranges.push({
      deviceNo,
      start: currentStart,
      end,
    });

    currentStart = end + 1;
  }

  return ranges.filter((range) => range.start <= range.end);
}

export const DEVICE_RANGES: DeviceRange[] = buildDeviceRanges();

export function calcLockerMapping(storageId: number): LockerMapping | null {
  if (!Number.isInteger(storageId) || storageId < 1 || storageId > MAX_LOCKERS) {
    return null;
  }

  const range = DEVICE_RANGES.find(
    (item) => storageId >= item.start && storageId <= item.end
  );

  if (!range) {
    return null;
  }

  return {
    deviceNo: range.deviceNo,
    lockerNo: storageId - range.start + 1,
  };
}

export function calcDeviceNo(storageId: number): number | null {
  return calcLockerMapping(storageId)?.deviceNo ?? null;
}

export function calcLockerNo(storageId: number): number | null {
  return calcLockerMapping(storageId)?.lockerNo ?? null;
}