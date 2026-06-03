import type { AnswerKind } from "@/lib/types";

interface Props {
  scoreByKind: Record<AnswerKind, number>;
}

export function KindBar({ scoreByKind }: Props) {
  const total = scoreByKind.best + scoreByKind.ok + scoreByKind.weak || 1;
  const bestPct = (scoreByKind.best / total) * 100;
  const okPct = (scoreByKind.ok / total) * 100;
  const weakPct = (scoreByKind.weak / total) * 100;

  return (
    <div className="kind-row" title={`Лучших: ${scoreByKind.best} · Норма: ${scoreByKind.ok} · Слабых: ${scoreByKind.weak}`}>
      <div className="kind-bar" aria-hidden="true">
        <span className="best" style={{ width: `${bestPct}%` }} />
        <span className="ok" style={{ width: `${okPct}%` }} />
        <span className="weak" style={{ width: `${weakPct}%` }} />
      </div>
    </div>
  );
}
