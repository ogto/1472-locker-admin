import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/admin/constants";
import { isProdEnv } from "@/lib/admin/cookie";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const inputPassword = String(body.password || "");
    const adminPassword = process.env.ADMIN_PASSWORD;
    const sessionToken = process.env.ADMIN_SESSION_TOKEN;

    if (!adminPassword || !sessionToken) {
      return NextResponse.json(
        { ok: false, message: "서버 환경변수가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    if (inputPassword !== adminPassword) {
      return NextResponse.json(
        { ok: false, message: "비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    const res = NextResponse.json({ ok: true, message: "로그인 성공" });

    res.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: sessionToken,
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