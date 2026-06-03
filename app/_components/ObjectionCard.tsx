import type { Objection } from "@/lib/types";

export function ObjectionCard({ objection }: { objection: Objection }) {
  return (
    <article className="card card-hover objection-card">
      <span className="stripe">Клиент говорит</span>
      <h3 style={{ fontSize: "1.05rem" }}>«{objection.customerObjection}»</h3>

      <div className="line-bad">
        <span className="line-tag tag-weak">плохой ответ</span>
        <p>{objection.badResponse || "—"}</p>
      </div>
      <div className="line-ok">
        <span className="line-tag tag-ok">хороший ответ</span>
        <p>{objection.goodResponse || "—"}</p>
      </div>
      <div className="line-good">
        <span className="line-tag tag-best">лучший ответ</span>
        <p>{objection.bestResponse}</p>
      </div>
      {objection.explanation && (
        <div>
          <span className="stripe">Почему так лучше</span>
          <p style={{ marginTop: 4 }}>{objection.explanation}</p>
        </div>
      )}
    </article>
  );
}
