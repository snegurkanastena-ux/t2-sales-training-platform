"use client";

import { useMemo, useState, useTransition } from "react";
import { recordTrainerAttempt } from "@/app/actions";
import type { AnswerKind, Scenario } from "@/lib/types";

interface Props {
  scenarios: Scenario[];
  employeeId: string;
  employeeName: string;
}

interface AnswerState {
  optionId: string;
  kind: AnswerKind;
  xpEarned: number;
}

const KIND_LABEL: Record<AnswerKind, string> = {
  weak: "Слабый ответ",
  ok: "Нормальный ответ",
  best: "Лучший ответ",
};

export function Trainer({ scenarios, employeeId, employeeName }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [pending, start] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  const [prevEmployeeId, setPrevEmployeeId] = useState(employeeId);

  if (prevEmployeeId !== employeeId) {
    setPrevEmployeeId(employeeId);
    setAnswers({});
  }

  const scenario = scenarios[activeIdx];

  const totalXp = useMemo(
    () => Object.values(answers).reduce((sum, a) => sum + a.xpEarned, 0),
    [answers]
  );

  if (!scenario) {
    return (
      <div className="trainer">
        <p>Сценарии тренажёра ещё не созданы. Добавьте их в разделе Администрирование.</p>
      </div>
    );
  }

  const answered = answers[scenario.id];

  function handleSelect(optionId: string) {
    if (answered) return;
    start(async () => {
      const result = await recordTrainerAttempt({
        employeeId,
        scenarioId: scenario.id,
        optionId,
      });
      if (result.ok) {
        setAnswers((prev) => ({
          ...prev,
          [scenario.id]: { optionId, kind: result.kind, xpEarned: result.xpEarned },
        }));
        if (result.kind === "best") {
          setToast(`+${result.xpEarned} XP — лучший ответ!`);
          window.setTimeout(() => setToast(null), 2400);
        }
      }
    });
  }

  return (
    <div className="trainer" id="trainer">
      <div className="trainer-header">
        <div>
          <span className="badge">Тренируется: {employeeName}</span>
          <h3 style={{ marginTop: 12, fontSize: "1.5rem" }}>{scenario.title}</h3>
          <p style={{ marginTop: 6 }}>{scenario.context}</p>
        </div>
        <div className="row-flex" style={{ gap: 8 }}>
          <span className="xp-pill">+{totalXp} XP за сессию</span>
          <span className="tag tag-accent">{Object.keys(answers).length} / {scenarios.length} сценариев</span>
        </div>
      </div>

      <div className="trainer-tabs" role="tablist" aria-label="Сценарии тренажёра">
        {scenarios.map((s, i) => {
          const a = answers[s.id];
          const active = i === activeIdx;
          return (
            <button
              key={s.id}
              role="tab"
              aria-selected={active}
              type="button"
              className={`trainer-tab${active ? " active" : ""}`}
              onClick={() => setActiveIdx(i)}
            >
              {i + 1}. {s.title.length > 30 ? `${s.title.slice(0, 28)}…` : s.title}
              {a && <span className={`tag tag-${a.kind}`} style={{ marginLeft: 8 }}>{KIND_LABEL[a.kind]}</span>}
            </button>
          );
        })}
      </div>

      <div className="customer-bubble" style={{ marginTop: 24 }}>
        <div className="who">Клиент</div>
        {scenario.customerLine}
      </div>

      <div className="answer-options" role="radiogroup" aria-label="Варианты ответа">
        {scenario.options.map((option) => {
          const isAnswered = !!answered;
          const isSelected = answered?.optionId === option.id;
          const cls = ["answer-option"];
          if (isAnswered) cls.push("disabled");
          if (isSelected) cls.push("selected", option.kind);
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={cls.join(" ")}
              onClick={() => handleSelect(option.id)}
              disabled={pending || isAnswered}
            >
              {option.text}
              {isSelected && (
                <span className={`tag tag-${option.kind}`}>{KIND_LABEL[option.kind]}</span>
              )}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className={`answer-feedback ${answered.kind}`} role="status">
          <div className="row">
            <h4>{KIND_LABEL[answered.kind]}</h4>
            <span className="xp-pill">
              {answered.kind === "best" ? "+" : answered.kind === "ok" ? "+" : ""}
              {answered.xpEarned} XP
            </span>
          </div>
          <p>
            {scenario.options.find((o) => o.id === answered.optionId)?.explanation}
          </p>
          <div className="row-flex">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setAnswers((prev) => {
                const next = { ...prev };
                delete next[scenario.id];
                return next;
              })}
            >
              Попробовать снова
            </button>
            {activeIdx < scenarios.length - 1 && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setActiveIdx(activeIdx + 1)}
              >
                Следующий сценарий →
              </button>
            )}
          </div>
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
