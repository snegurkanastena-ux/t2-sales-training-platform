"use client";

import { useTransition } from "react";
import { setModuleStatus } from "@/app/actions";
import type { ModuleEntry, ModuleStatus } from "@/lib/types";

interface Props {
  module: ModuleEntry;
  employeeId: string;
  status: ModuleStatus;
}

const NEXT_STATE: Record<ModuleStatus, ModuleStatus> = {
  not_started: "in_progress",
  in_progress: "completed",
  completed: "not_started",
};

const LABEL: Record<ModuleStatus, string> = {
  not_started: "Не начат",
  in_progress: "В процессе",
  completed: "Пройден",
};

const ACTION_LABEL: Record<ModuleStatus, string> = {
  not_started: "Начать",
  in_progress: "Завершить",
  completed: "Сбросить",
};

export function ModuleCard({ module, employeeId, status }: Props) {
  const [pending, start] = useTransition();
  const next = NEXT_STATE[status];

  return (
    <article className="card card-hover module-card">
      <div className="row-between">
        <span className="stripe">Модуль · {module.order}</span>
        <span className={`status-pill status-${status}`}>{LABEL[status]}</span>
      </div>
      <h3>{module.title}</h3>
      <p>{module.description}</p>
      <div>
        <span className="stripe">Цель</span>
        <p style={{ marginTop: 4 }}>{module.goal}</p>
      </div>
      {module.outcomes.length > 0 && (
        <div>
          <span className="stripe">Чему научится продавец</span>
          <ul className="outcomes" style={{ marginTop: 8 }}>
            {module.outcomes.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </div>
      )}
      {module.example && (
        <div>
          <span className="stripe">Пример результата</span>
          <p style={{ marginTop: 4 }}>{module.example}</p>
        </div>
      )}
      <div className="footer">
        <span className="xp-pill">+{module.xp} XP</span>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await setModuleStatus({ employeeId, moduleId: module.id, status: next });
            })
          }
        >
          {pending ? "..." : ACTION_LABEL[status]}
        </button>
      </div>
    </article>
  );
}
