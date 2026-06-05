"use client";

import { useEffect, useState } from "react";
import {
  fetchColdAssignmentConfig,
  saveColdAssignmentConfig,
} from "@/lib/lockers/api";

type AssignmentForm = {
  startGroup: string;
  disabledGroupsText: string;
  memo: string;
};

function parseDisabledGroups(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return [];
  }

  return Array.from(
    new Set(
      trimmed
        .split(/[,\s]+/)
        .map((item) => Number(item.trim()))
        .filter((item) => Number.isInteger(item))
    )
  ).sort((a, b) => a - b);
}

export function AssignmentConfigPanel() {
  const [form, setForm] = useState<AssignmentForm>({
    startGroup: "1",
    disabledGroupsText: "",
    memo: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  useEffect(() => {
    void loadConfig();
  }, []);

  async function loadConfig() {
    setLoading(true);
    setErrorText("");
    setSuccessText("");

    try {
      const config = await fetchColdAssignmentConfig();

      setForm({
        startGroup: String(config.startGroup),
        disabledGroupsText: config.disabledGroups.join(", "),
        memo: config.memo,
      });
    } catch (error) {
      setErrorText(
        error instanceof Error
          ? error.message
          : "냉장 그룹 배정 설정을 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  function updateForm(key: keyof AssignmentForm, value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSave() {
    const startGroup = Number(form.startGroup.trim());

    if (!Number.isInteger(startGroup) || startGroup < 1) {
      setErrorText("시작 그룹은 1 이상의 숫자여야 합니다.");
      return;
    }

    const invalidDisabledGroupText = form.disabledGroupsText
      .trim()
      .split(/[,\s]+/)
      .filter(Boolean)
      .find((item) => {
        const parsed = Number(item);
        return !Number.isInteger(parsed) || parsed < 1;
      });

    if (invalidDisabledGroupText) {
      setErrorText("제외 그룹에 숫자가 아닌 값이 있습니다.");
      return;
    }

    setSaving(true);
    setErrorText("");
    setSuccessText("");

    try {
      const saved = await saveColdAssignmentConfig({
        startGroup,
        disabledGroups: parseDisabledGroups(form.disabledGroupsText),
        memo: form.memo.trim(),
      });

      setForm({
        startGroup: String(saved.startGroup),
        disabledGroupsText: saved.disabledGroups.join(", "),
        memo: saved.memo,
      });
      setSuccessText("냉장 그룹 배정 설정을 저장했습니다.");
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "냉장 그룹 배정 설정 저장에 실패했습니다."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-[0_20px_50px_rgba(255,182,193,0.12)] backdrop-blur sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-lg font-black text-slate-900">냉장 그룹 배정 설정</div>
          <div className="mt-1 text-sm font-bold text-slate-500">
            냉장 보관함 배정 시작 그룹과 제외 그룹을 관리합니다.
          </div>
        </div>
        <button
          type="button"
          onClick={() => void loadConfig()}
          disabled={loading || saving}
          className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
        >
          {loading ? "조회 중..." : "설정 새로고침"}
        </button>
      </div>

      {errorText ? (
        <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700">
          {errorText}
        </div>
      ) : null}

      {successText ? (
        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
          {successText}
        </div>
      ) : null}

      <div className="mt-4 rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="text-base font-black text-slate-900">냉장</div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
            1~300
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-black text-slate-500">시작 그룹</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={form.startGroup}
              onChange={(event) =>
                updateForm("startGroup", event.target.value.replace(/[^\d]/g, ""))
              }
              className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-900 outline-none transition focus:border-rose-200 focus:shadow-[0_0_0_6px_rgba(251,207,232,0.35)]"
            />
          </label>

          <label className="block">
            <span className="text-xs font-black text-slate-500">제외 그룹</span>
            <input
              type="text"
              inputMode="numeric"
              value={form.disabledGroupsText}
              onChange={(event) =>
                updateForm("disabledGroupsText", event.target.value)
              }
              className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-900 outline-none transition focus:border-rose-200 focus:shadow-[0_0_0_6px_rgba(251,207,232,0.35)]"
              placeholder="예: 1, 3"
            />
          </label>
        </div>

        <label className="mt-3 block">
          <span className="text-xs font-black text-slate-500">메모</span>
          <input
            type="text"
            value={form.memo}
            onChange={(event) => updateForm("memo", event.target.value)}
            className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-900 outline-none transition focus:border-rose-200 focus:shadow-[0_0_0_6px_rgba(251,207,232,0.35)]"
            placeholder="예: 1그룹 점검"
          />
        </label>

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={loading || saving}
          className="mt-4 h-11 w-full rounded-2xl bg-slate-950 px-4 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-300"
        >
          {saving ? "저장 중..." : "냉장 저장"}
        </button>
      </div>
    </section>
  );
}
