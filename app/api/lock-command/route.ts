import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/admin/constants";

export async function POST(req: NextRequest) {
  try {
    const sessionToken = process.env.ADMIN_SESSION_TOKEN;
    const superToken = process.env.SUPER_ADMIN_SESSION_TOKEN;
    const cookieValue = req.cookies.get(ADMIN_COOKIE_NAME)?.value;

    if (!sessionToken || cookieValue !== sessionToken || !superToken || cookieValue !== superToken) {
      return NextResponse.json(
        { ok: false, message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { point, storageId, pulseMs, requestedBy, requestNote } = body;

    const normalizedPoint = String(point || "").trim().toLowerCase();
    const parsedStorageId = Number(storageId);
    let parsedPulseMs = Number(pulseMs);

    if (!normalizedPoint) {
      return NextResponse.json(
        { ok: false, message: "point 는 필수입니다." },
        { status: 400 }
      );
    }

    if (normalizedPoint !== "bank") {
      return NextResponse.json(
        { ok: false, message: "현재는 bank 지점만 지원합니다." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(parsedStorageId) || parsedStorageId < 1) {
      return NextResponse.json(
        { ok: false, message: "storageId 는 1 이상의 숫자여야 합니다." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(parsedPulseMs) || parsedPulseMs < 100 || parsedPulseMs > 10000) {
      parsedPulseMs = 500;
    }

    const rand = Math.random().toString(36).slice(2, 8);
    const commandKey = `${normalizedPoint}-${parsedStorageId}-${Date.now()}-${rand}`;

    const payload = {
      point: normalizedPoint,
      storageId: parsedStorageId,
      pulseMs: parsedPulseMs,
      commandKey,
      requestedBy: String(requestedBy || "admin-web").trim(),
      requestNote: String(
        requestNote || `관리자 웹에서 수동 오픈 (${parsedStorageId}번)`
      ).trim(),
    };

    const API_BASE =
      process.env.LOCK_COMMAND_API_BASE ||
      "https://cloud.1472.ai:18443/api/v4/bread-storage/lock-command";

    const response = await fetch(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/plain, */*",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") || "";
    const rawText = await response.text();

    let parsedData: unknown = rawText;
    if (rawText && contentType.includes("application/json")) {
      try {
        parsedData = JSON.parse(rawText);
      } catch {
        parsedData = {
          parseError: true,
          message: "외부 API JSON 파싱 실패",
          rawText,
        };
      }
    }

    return NextResponse.json(
      {
        ok: response.ok,
        status: response.status,
        requestUrl: API_BASE,
        requestBody: payload,
        responseContentType: contentType,
        data: parsedData,
      },
      { status: response.status }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "락 명령 생성 요청 중 서버 내부 오류가 발생했습니다.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}