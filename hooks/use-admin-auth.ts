"use client";

import { useEffect, useState } from "react";
import type { SessionResponse, AdminRole } from "@/lib/admin/types";

export function useAdminAuth() {
  const [booting, setBooting] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [role, setRole] = useState<AdminRole | null>(null);

  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    bootstrapAuth();
  }, []);

  async function bootstrapAuth() {
    try {
      const res = await fetch("/api/session", {
        method: "GET",
        credentials: "same-origin",
      });

      const data: SessionResponse = await res.json();

      setAuthenticated(Boolean(res.ok && data.authenticated));
      setRole(data.role ?? null);
    } catch {
      setAuthenticated(false);
      setRole(null);
    } finally {
      setBooting(false);
    }
  }

  async function handleLogin() {
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        setAuthenticated(true);
        setRole(data.role ?? null);
        setPassword("");
        return;
      }

      setLoginError(data?.message || "비밀번호가 올바르지 않습니다.");
    } catch {
      setLoginError("로그인 요청 중 오류가 발생했습니다.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } finally {
      setAuthenticated(false);
      setRole(null);
      setPassword("");
      setLoginError("");
    }
  }

  return {
    booting,
    authenticated,
    role,
    password,
    setPassword,
    loginError,
    loginLoading,
    handleLogin,
    handleLogout,
    setAuthenticated,
    setRole,
  };
}