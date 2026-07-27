"use client";

import { useEffect, useState } from "react";
import {
  COLD_ASSIGNMENT_GROUPS,
  DEFAULT_COLD_ASSIGNMENT_ORDER,
  fetchColdAssignmentConfig,
  saveColdAssignmentConfig,
} from "@/lib/lockers/api";
import type {
  AssignmentConfig,
  ColdAssignmentGroupId,
} from "@/lib/lockers/api";

type AssignmentForm = AssignmentConfig;

const GROUP_RANGE: Record<ColdAssignmentGroupId, string> = {
  "1": "1~58",
  "2-1": "59~96",
  "2-2": "97~136",
  "3-1": "137~174",
  "3-2": "175~214",
  "3-3": "305~352",
};

function createDefaultForm(): AssignmentForm {
  return {
    assignmentOrder: [...DEFAULT_COLD_ASSIGNMENT_ORDER],
    disabledGroups: [],
    memo: "",
  };
}

function isValidAssignmentOrder(
  order: ColdAssignmentGroupId[]
): boolean {
  return (
    order.length === COLD_ASSIGNMENT_GROUPS.length &&
    new Set(order).size === COLD_ASSIGNMENT_GROUPS.length &&
    COLD_ASSIGNMENT_GROUPS.every((groupId) => order.includes(groupId))
  );
}

export function AssignmentConfigPanel() {
  const [form, setForm] = useState<AssignmentForm>(createDefaultForm);
  const [appliedConfig, setAppliedConfig] = useState<AssignmentConfig | null>(null);
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

      setForm(config);
      setAppliedConfig(config);
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

  function moveGroup(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= form.assignmentOrder.length) return;

    setForm((prev) => {
      const assignmentOrder = [...prev.assignmentOrder];
      [assignmentOrder[index], assignmentOrder[targetIndex]] = [
        assignmentOrder[targetIndex],
        assignmentOrder[index],
      ];

      return { ...prev, assignmentOrder };
    });
    setSuccessText("");
  }

  function toggleDisabledGroup(groupId: ColdAssignmentGroupId) {
    setForm((prev) => ({
      ...prev,
      disabledGroups: prev.disabledGroups.includes(groupId)
        ? prev.disabledGroups.filter((item) => item !== groupId)
        : [...prev.disabledGroups, groupId],
    }));
    setSuccessText("");
  }

  async function handleSave() {
    if (!isValidAssignmentOrder(form.assignmentOrder)) {
      setErrorText("배정 순서에는 지원하는 6개 그룹이 중복이나 누락 없이 모두 있어야 합니다.");
      return;
    }

    setSaving(true);
    setErrorText("");
    setSuccessText("");

    try {
      const saved = await saveColdAssignmentConfig({
        assignmentOrder: form.assignmentOrder,
        disabledGroups: form.disabledGroups,
        memo: form.memo.trim(),
      });

      setForm(saved);
      setAppliedConfig(saved);
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
            은행점 냉장 보관함의 배정 우선순위와 사용불가 그룹을 관리합니다.
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

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <div className="text-xs font-black text-slate-500">현재 배정 순서</div>
          <div className="mt-1 text-base font-black text-slate-950">
            {appliedConfig
              ? appliedConfig.assignmentOrder.join(" → ")
              : loading
                ? "조회 중"
                : "-"}
          </div>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <div className="text-xs font-black text-slate-500">현재 사용불가 그룹</div>
          <div className="mt-1 text-base font-black text-slate-950">
            {appliedConfig
              ? appliedConfig.disabledGroups.join(", ") || "없음"
              : loading
                ? "조회 중"
                : "-"}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm">
        <div>
          <div className="text-base font-black text-slate-900">배정 순서</div>
          <p className="mt-1 text-xs font-bold text-slate-500">
            위에서부터 우선 배정됩니다. 사용불가 그룹도 순서에는 포함해야 합니다.
          </p>
        </div>

        <ol className="mt-4 space-y-2">
          {form.assignmentOrder.map((groupId, index) => {
            const disabled = form.disabledGroups.includes(groupId);

            return (
              <li
                key={groupId}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="font-black text-slate-950">그룹 {groupId}</div>
                    <div className="text-xs font-bold text-slate-500">
                      보관함 {GROUP_RANGE[groupId]}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1 text-xs font-black text-slate-700">
                    <input
                      type="checkbox"
                      checked={disabled}
                      onChange={() => toggleDisabledGroup(groupId)}
                      className="h-4 w-4 accent-rose-500"
                    />
                    사용불가
                  </label>
                  <button
                    type="button"
                    onClick={() => moveGroup(index, -1)}
                    disabled={index === 0 || loading || saving}
                    aria-label={`${groupId} 그룹을 위로 이동`}
                    className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    위
                  </button>
                  <button
                    type="button"
                    onClick={() => moveGroup(index, 1)}
                    disabled={
                      index === form.assignmentOrder.length - 1 || loading || saving
                    }
                    aria-label={`${groupId} 그룹을 아래로 이동`}
                    className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    아래
                  </button>
                </div>
              </li>
            );
          })}
        </ol>

        <label className="mt-4 block">
          <span className="text-xs font-black text-slate-500">메모</span>
          <input
            type="text"
            value={form.memo}
            onChange={(event) => {
              setForm((prev) => ({ ...prev, memo: event.target.value }));
              setSuccessText("");
            }}
            className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-900 outline-none transition focus:border-rose-200 focus:shadow-[0_0_0_6px_rgba(251,207,232,0.35)]"
            placeholder="예: 2그룹부터 우선 배정"
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
