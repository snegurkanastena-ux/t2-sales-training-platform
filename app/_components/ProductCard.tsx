import type { Product, ProductCategory } from "@/lib/types";

const ICONS: Record<ProductCategory, string> = {
  sim: "📶",
  "premium-number": "★",
  smartphone: "📱",
  accessory: "🛡",
  camera: "📷",
  wink: "▶",
  speaker: "🔊",
  service: "✦",
};

export function ProductCard({ product }: { product: Product }) {
  const args = product.sellingArguments ?? [];
  const objections = product.commonObjections ?? [];

  return (
    <article className="card card-hover card-glow product-card">
      <div className="head">
        <div>
          <h3>{product.name}</h3>
          {product.tags.length > 0 && (
            <div className="tag-row" style={{ marginTop: 8 }}>
              {product.tags.map((t) => (
                <span key={t} className="tag">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
        <span className="product-icon" aria-hidden="true">
          {ICONS[product.category] ?? "•"}
        </span>
      </div>
      <dl>
        <div>
          <dt>Кому подходит</dt>
          <dd>{product.audience}</dd>
        </div>
        <div>
          <dt>Какую проблему решает</dt>
          <dd>{product.problem}</dd>
        </div>
        <div>
          <dt>Как объяснить простыми словами</dt>
          <dd>{product.plainExplanation}</dd>
        </div>
        {args.length > 0 && (
          <div>
            <dt>Аргументы для продажи</dt>
            <dd>
              <ul className="outcomes" style={{ marginTop: 4 }}>
                {args.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </dd>
          </div>
        )}
        {objections.length > 0 && (
          <div>
            <dt>Частые возражения</dt>
            <dd>
              <div className="tag-row">
                {objections.map((o, i) => (
                  <span key={i} className="tag tag-weak">
                    «{o}»
                  </span>
                ))}
              </div>
            </dd>
          </div>
        )}
        {product.objectionResponse && (
          <div>
            <dt>Готовый ответ продавца</dt>
            <dd style={{ color: "var(--text)" }}>{product.objectionResponse}</dd>
          </div>
        )}
      </dl>
    </article>
  );
}
