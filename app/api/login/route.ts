import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_ROLE_COOKIE_NAME,
} from "@/lib/admin/constants";
import { isProdEnv } from "@/lib/admin/cookie";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const inputPassword = String(body.password || "").trim();

    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminSessionToken = process.env.ADMIN_SESSION_TOKEN;

    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
    const superAdminSessionToken = process.env.SUPER_ADMIN_SESSION_TOKEN;

    if (
      !adminPassword ||
      !adminSessionToken ||
      !superAdminPassword ||
      !superAdminSessionToken
    ) {
      return NextResponse.json(
        { ok: false, message: "서버 환경변수가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    let role: "admin" | "super-admin" | null = null;
    let sessionToken = "";

    if (inputPassword === superAdminPassword) {
      role = "super-admin";
      sessionToken = superAdminSessionToken;
    } else if (inputPassword === adminPassword) {
      role = "admin";
      sessionToken = adminSessionToken;
    }

    if (!role || !sessionToken) {
      return NextResponse.json(
        { ok: false, message: "비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    const res = NextResponse.json({
      ok: true,
      message: "로그인 성공",
      role,
    });

    res.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      sameSite: "lax",
      secure: isProdEnv(),
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    res.cookies.set({
      name: ADMIN_ROLE_COOKIE_NAME,
      value: role,
      httpOnly: true,
      sameSite: "lax",
      secure: isProdEnv(),
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return res;
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "로그인 처리 중 오류가 발생했습니다.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}