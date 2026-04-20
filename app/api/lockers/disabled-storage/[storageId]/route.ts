import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/admin/constants";

const BASE_URL = "https://cloud.1472.ai:18443/api/v4/bread-storage";

function isAuthorized(request: NextRequest) {
  const adminToken = process.env.ADMIN_SESSION_TOKEN;
  const superAdminToken = process.env.SUPER_ADMIN_SESSION_TOKEN;
  const cookieValue = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const allowedTokens = [adminToken, superAdminToken].filter(Boolean);

  return cookieValue && allowedTokens.includes(cookieValue);
}

function parseStorageId(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ storageId: string }> }
) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { ok: false, message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const { storageId: rawStorageId } = await context.params;
    const storageId = parseStorageId(rawStorageId);

    if (storageId == null) {
      return NextResponse.json(
        { ok: false, message: "유효한 storageId가 필요합니다." },
        { status: 400 }
      );
    }

    const requestBody = await request.json().catch(() => ({}));

    const response = await fetch(`${BASE_URL}/bank/disabled-storage/${storageId}`, {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody ?? {}),
    });

    const text = await response.text();

    let parsedData: unknown = null;

    try {
      parsedData = text ? JSON.parse(text) : null;
    } catch {
      parsedData = null;
    }

    return NextResponse.json(
      {
        ok: response.ok,
        status: response.status,
        data: parsedData,
        message: response.ok
          ? "사용불가 설정 완료"
          : "사용불가 설정 실패",
      },
      { status: response.status }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "사용불가 설정 중 오류가 발생했습니다.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ storageId: string }> }
) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { ok: false, message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const { storageId: rawStorageId } = await context.params;
    const storageId = parseStorageId(rawStorageId);

    if (storageId == null) {
      return NextResponse.json(
        { ok: false, message: "유효한 storageId가 필요합니다." },
        { status: 400 }
      );
    }

    const response = await fetch(`${BASE_URL}/bank/disabled-storage/${storageId}`, {
      method: "DELETE",
      cache: "no-store",
      headers: {
        Accept: "application/json, text/plain, */*",
      },
    });

    return NextResponse.json(
      {
        ok: response.ok,
        status: response.status,
        message: response.ok
          ? "사용불가 해제 완료"
          : "사용불가 해제 실패",
      },
      { status: response.status }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "사용불가 해제 중 오류가 발생했습니다.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
