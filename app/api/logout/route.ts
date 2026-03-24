import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_ROLE_COOKIE_NAME,
} from "@/lib/admin/constants";
import { isProdEnv } from "@/lib/admin/cookie";

export async function POST() {
  const res = NextResponse.json({ ok: true, message: "로그아웃 완료" });

  res.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: isProdEnv(),
    path: "/",
    maxAge: 0,
  });

  res.cookies.set({
    name: ADMIN_ROLE_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: isProdEnv(),
    path: "/",
    maxAge: 0,
  });

  return res;
}