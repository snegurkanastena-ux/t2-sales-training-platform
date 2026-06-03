import type { Product, Promotion } from "@/lib/types";

interface Props {
  promotion: Promotion;
  products: Product[];
}

function formatRange(from: string, to: string): string {
  if (!from && !to) return "Действует постоянно";
  const fmt = (s: string) =>
    s
      ? new Date(s).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" })
      : "—";
  return `${fmt(from)} — ${fmt(to)}`;
}

export function PromotionCard({ promotion, products }: Props) {
  const linked = products.filter((p) => promotion.productIds.includes(p.id));
  return (
    <article className="card card-hover promo-card">
      <div className="row-between" style={{ alignItems: "flex-start" }}>
        <h3>{promotion.title}</h3>
        <span className="tag tag-accent">{formatRange(promotion.validFrom, promotion.validTo)}</span>
      </div>
      <p>{promotion.description}</p>
      {linked.length > 0 && (
        <div className="tag-row">
          {linked.map((p) => (
            <span key={p.id} className="tag">
              {p.name}
            </span>
          ))}
        </div>
      )}
      {promotion.pitch && (
        <div>
          <span className="stripe">Как предложить</span>
          <p style={{ marginTop: 4 }}>{promotion.pitch}</p>
        </div>
      )}
      {promotion.phrases.length > 0 && (
        <div>
          <span className="stripe">Фразы продавца</span>
          <ul className="outcomes" style={{ marginTop: 8 }}>
            {promotion.phrases.map((ph, i) => (
              <li key={i}>{ph}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
