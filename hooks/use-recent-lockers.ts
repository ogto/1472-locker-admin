"use client";

import { useEffect, useState } from "react";
import { MAX_LOCKERS } from "@/lib/lockers/constants";
import { RECENT_STORAGE_KEY, RECENT_STORAGE_LIMIT } from "@/lib/admin/constants";

export function useRecentLockers() {
  const [recentStorageIds, setRecentStorageIds] = useState<number[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;

      const cleaned = parsed
        .map((v) => Number(v))
        .filter((v) => Number.isInteger(v) && v >= 1 && v <= MAX_LOCKERS)
        .slice(0, RECENT_STORAGE_LIMIT);

      setRecentStorageIds(cleaned);
    } catch {}
  }, []);

  function pushRecentStorage(no: number) {
    setRecentStorageIds((prev) => {
      const next = [no, ...prev.filter((v) => v !== no)].slice(0, RECENT_STORAGE_LIMIT);
      try {
        localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  return {
    recentStorageIds,
    pushRecentStorage,
  };
}