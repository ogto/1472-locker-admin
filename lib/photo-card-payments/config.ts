export const PHOTO_CARD_TOSS_CLIENT_KEY =
  process.env.NEXT_PUBLIC_PHOTO_CARD_TOSS_CLIENT_KEY?.trim() ||
  process.env.NEXT_PUBLIC_PHOTO_CARD_TOSS_LIVE_CLIENT_KEY?.trim() ||
  process.env.NEXT_PUBLIC_HEALTH_BOX_TOSS_CLIENT_KEY?.trim() ||
  "";

export const PHOTO_CARD_DEFAULT_AMOUNT = 1000;
export const PHOTO_CARD_DEFAULT_ORDER_NAME = "꿈돌이 빵장고 QR 사진 공유";

export function formatWon(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

export function normalizeAmount(value: string | number | null | undefined) {
  const amount = Number(value || 0);

  if (!Number.isFinite(amount) || amount <= 0) {
    return PHOTO_CARD_DEFAULT_AMOUNT;
  }

  return Math.floor(amount);
}
