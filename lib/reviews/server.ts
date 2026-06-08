import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/admin/constants";

export function requireAdminSession(req: NextRequest) {
  const adminToken = process.env.ADMIN_SESSION_TOKEN;
  const superAdminToken = process.env.SUPER_ADMIN_SESSION_TOKEN;
  const cookieValue = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const allowedTokens = [adminToken, superAdminToken].filter(Boolean);

  return Boolean(cookieValue && allowedTokens.includes(cookieValue));
}

export function getReviewBotBaseUrl() {
  return (process.env.REVIEW_BOT_BASE_URL || "https://bot.1472.ai").replace(
    /\/+$/,
    ""
  );
}

export function getReviewBotAdminToken() {
  return process.env.REVIEW_BOT_ADMIN_TOKEN || process.env.ADMIN_TOKEN || "";
}

export async function proxyReviewBotJson(
  req: NextRequest,
  path: string,
  init: RequestInit = {}
) {
  if (!requireAdminSession(req)) {
    return NextResponse.json(
      { ok: false, message: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  const adminToken = getReviewBotAdminToken();

  if (!adminToken) {
    return NextResponse.json(
      { ok: false, message: "REVIEW_BOT_ADMIN_TOKEN 설정이 필요합니다." },
      { status: 500 }
    );
  }

  const response = await fetch(`${getReviewBotBaseUrl()}${path}`, {
    ...init,
    headers: {
      "X-Admin-Token": adminToken,
      "X-Admin-User": "locker-admin",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  const text = await response.text();
  let data: unknown = null;

  try {
    data = JSON.parse(text);
  } catch {
    data = { ok: false, message: text || "리뷰봇 응답을 해석할 수 없습니다." };
  }

  return NextResponse.json(data, { status: response.status });
}
