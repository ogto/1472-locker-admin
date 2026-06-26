import {
  MAX_LOCKERS,
} from "@/lib/lockers/constants";

export type DeviceRange = {
  deviceNo: number;
  start: number;
  end: number;
  lockerStart?: number;
};

export type LockerMapping = {
  deviceNo: number;
  lockerNo: number;
};

function buildDeviceRanges(): DeviceRange[] {
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
    { deviceNo: 220, start: 353, end: 368 },
    { deviceNo: 221, start: 369, end: 384 },
    { deviceNo: 222, start: 385, end: 396 },
  ];

  const roomEightChannelRanges: DeviceRange[] = [
    { deviceNo: 39, start: 305, end: 308, lockerStart: 5 },
    { deviceNo: 40, start: 309, end: 316 },
    { deviceNo: 41, start: 317, end: 324 },
    { deviceNo: 42, start: 325, end: 332 },
    { deviceNo: 43, start: 333, end: 340 },
    { deviceNo: 44, start: 341, end: 348 },
    { deviceNo: 45, start: 349, end: 352 },
  ];

  const ranges = [
    ...coldSixteenChannelRanges,
    // 보관함 215~304는 현재 미사용.
    // ESP 217~219의 6타워 16채널 전환 전까지 305~352는 기존 301 기준 8채널 매핑을 유지한다.
    ...roomEightChannelRanges,
  ];

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
    lockerNo: storageId - range.start + (range.lockerStart ?? 1),
  };
}

export function calcDeviceNo(storageId: number): number | null {
  return calcLockerMapping(storageId)?.deviceNo ?? null;
}

export function calcLockerNo(storageId: number): number | null {
  return calcLockerMapping(storageId)?.lockerNo ?? null;
}
