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

  // 1 ~ 17번 ESP: 각 8개씩
  for (let deviceNo = 1; deviceNo <= 17; deviceNo += 1) {
    const start = (deviceNo - 1) * 8 + 1;
    const end = start + 7;

    ranges.push({
      deviceNo,
      start,
      end: Math.min(end, MAX_LOCKERS),
    });
  }

  // 18번 ESP: 예외적으로 6개만 사용
  ranges.push({
    deviceNo: 18,
    start: 137,
    end: Math.min(142, MAX_LOCKERS),
  });

  // 19 ~ 37번 ESP: 18번에서 빠진 2칸 때문에 143번부터 이어서 각 8개씩
  let coldStart = 143;

  for (let deviceNo = 19; deviceNo <= 37; deviceNo += 1) {
    const end = Math.min(coldStart + 7, MAX_LOCKERS);

    ranges.push({
      deviceNo,
      start: coldStart,
      end,
    });

    coldStart = end + 1;
  }

  // 38번 ESP: 예외적으로 295 ~ 300만 사용
  ranges.push({
    deviceNo: 38,
    start: 295,
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
