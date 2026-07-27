import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/admin/constants";
import {
  COLD_ASSIGNMENT_GROUPS,
  type ColdAssignmentGroupId,
} from "@/lib/lockers/api";

const UPSTREAM_URL =
  "https://cloud.1472.ai:18443/api/v4/bread-storage/bank/cold-assignment-config";

function isAuthorized(request: NextRequest) {
  const adminToken = process.env.ADMIN_SESSION_TOKEN;
  const superAdminToken = process.env.SUPER_ADMIN_SESSION_TOKEN;
  const cookieValue = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const allowedTokens = [adminToken, superAdminToken].filter(Boolean);

  return cookieValue && allowedTokens.includes(cookieValue);
}

async function parseResponse(response: Response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractUpstreamMessage(data: unknown) {
  if (!data) return "";

  if (typeof data === "string") {
    return data;
  }

  if (typeof data !== "object") {
    return "";
  }

  const record = data as Record<string, unknown>;

  return String(record.message || record.detail || record.error || "");
}

function isColdAssignmentGroupId(value: unknown): value is ColdAssignmentGroupId {
  return (
    typeof value === "string" &&
    COLD_ASSIGNMENT_GROUPS.includes(value as ColdAssignmentGroupId)
  );
}

function parseSaveBody(value: unknown) {
  if (!value || typeof value !== "object") return null;

  const body = value as Record<string, unknown>;
  const assignmentOrder = body.assignmentOrder;
  const disabledGroups = body.disabledGroups;

  if (
    !Array.isArray(assignmentOrder) ||
    assignmentOrder.length !== COLD_ASSIGNMENT_GROUPS.length ||
    !assignmentOrder.every(isColdAssignmentGroupId) ||
    new Set(assignmentOrder).size !== COLD_ASSIGNMENT_GROUPS.length ||
    !COLD_ASSIGNMENT_GROUPS.every((groupId) => assignmentOrder.includes(groupId)) ||
    !Array.isArray(disabledGroups) ||
    !disabledGroups.every(isColdAssignmentGroupId)
  ) {
    return null;
  }

  return {
    assignmentOrder,
    disabledGroups: Array.from(new Set(disabledGroups)),
    memo: typeof body.memo === "string" ? body.memo : "",
  };
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { ok: false, message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const response = await fetch(UPSTREAM_URL, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json, text/plain, */*",
      },
    });

    const data = await parseResponse(response);

    return NextResponse.json(
      {
        ok: response.ok,
        status: response.status,
        data,
        message: response.ok
          ? "냉장 그룹 배정 설정 조회 완료"
          : extractUpstreamMessage(data) || "냉장 그룹 배정 설정 조회 실패",
      },
      { status: response.status }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "냉장 그룹 배정 설정 조회 중 오류가 발생했습니다.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { ok: false, message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body = parseSaveBody(await request.json().catch(() => null));

    if (!body) {
      return NextResponse.json(
        {
          ok: false,
          message: "배정 순서와 사용불가 그룹 설정을 확인해 주세요.",
        },
        { status: 400 }
      );
    }

    const response = await fetch(UPSTREAM_URL, {
      method: "PUT",
      cache: "no-store",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await parseResponse(response);

    return NextResponse.json(
      {
        ok: response.ok,
        status: response.status,
        data,
        message: response.ok
          ? "냉장 그룹 배정 설정 저장 완료"
          : extractUpstreamMessage(data) || "냉장 그룹 배정 설정 저장 실패",
      },
      { status: response.status }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "냉장 그룹 배정 설정 저장 중 오류가 발생했습니다.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
