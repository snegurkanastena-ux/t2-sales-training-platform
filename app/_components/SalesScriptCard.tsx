import type { SalesScript } from "@/lib/types";

export function SalesScriptCard({ script }: { script: SalesScript }) {
  return (
    <article className="card card-hover script-card">
      <h3>{script.situation}</h3>
      {script.goal && (
        <div>
          <span className="stripe">Цель продавца</span>
          <p style={{ marginTop: 4 }}>{script.goal}</p>
        </div>
      )}
      <div className="line-bad">
        <span className="line-tag tag-weak">слабая фраза</span>
        <p>{script.weakLine || "—"}</p>
      </div>
      <div className="line-good">
        <span className="line-tag tag-best">правильная фраза</span>
        <p>{script.goodLine}</p>
      </div>
      {script.explanation && (
        <div>
          <span className="stripe">Почему правильная фраза работает</span>
          <p style={{ marginTop: 4 }}>{script.explanation}</p>
        </div>
      )}
    </article>
  );
}
