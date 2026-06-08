import {
  MAX_LOCKERS,
  MAX_ROOM_TEMPERATURE_DEVICE_NO,
} from "@/lib/lockers/constants";

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

  const coldSixteenChannelRanges: DeviceRange[] = [
    { deviceNo: 201, start: 1, end: 16 },
    { deviceNo: 202, start: 17, end: 32 },
    { deviceNo: 203, start: 33, end: 48 },
    { deviceNo: 204, start: 49, end: 58 },
    { deviceNo: 205, start: 59, end: 74 },
    { deviceNo: 206, start: 75, end: 90 },
    { deviceNo: 207, start: 91, end: 96 },
    { deviceNo: 208, start: 97, end: 112 },
    { deviceNo: 209, start: 113, end: 128 },
    { deviceNo: 210, start: 129, end: 136 },
    { deviceNo: 211, start: 137, end: 152 },
    { deviceNo: 212, start: 153, end: 168 },
    { deviceNo: 213, start: 169, end: 174 },
    { deviceNo: 214, start: 175, end: 190 },
    { deviceNo: 215, start: 191, end: 206 },
    { deviceNo: 216, start: 207, end: 214 },
    { deviceNo: 217, start: 215, end: 230 },
    { deviceNo: 218, start: 231, end: 246 },
    { deviceNo: 219, start: 247, end: 262 },
    { deviceNo: 220, start: 263, end: 278 },
    { deviceNo: 221, start: 279, end: 294 },
    { deviceNo: 222, start: 295, end: 300 },
  ];

  ranges.push(...coldSixteenChannelRanges);

  // 냉장은 16채널 ESP 201~222, 상온은 기존 8채널 ESP 39~50을 유지
  let currentStart = 301;

  for (
    let deviceNo = 39;
    deviceNo <= MAX_ROOM_TEMPERATURE_DEVICE_NO;
    deviceNo += 1
  ) {
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
