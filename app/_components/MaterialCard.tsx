import type { LearningMaterial, LearningMaterialType, Product, Promotion } from "@/lib/types";

interface Props {
  material: LearningMaterial;
  products: Product[];
  promotions: Promotion[];
}

const TYPE_LABEL: Record<LearningMaterialType, string> = {
  article: "Статья",
  checklist: "Чек-лист",
  tip: "Совет",
  video: "Видео",
  guide: "Гайд",
};

export function MaterialCard({ material, products, promotions }: Props) {
  const product = material.productId ? products.find((p) => p.id === material.productId) : null;
  const promotion = material.promotionId ? promotions.find((p) => p.id === material.promotionId) : null;

  return (
    <article className="card card-hover material-card">
      <div className="row-between" style={{ alignItems: "flex-start" }}>
        <h3>{material.title}</h3>
        <span className="tag tag-accent">{TYPE_LABEL[material.type]}</span>
      </div>
      {material.description && <p>{material.description}</p>}
      {material.body && (
        <div className="material-body">
          {material.body.split(/\n/).map((line, i) => (
            <p key={i} style={{ color: "var(--text)" }}>
              {line}
            </p>
          ))}
        </div>
      )}
      {(product || promotion) && (
        <div className="tag-row">
          {product && <span className="tag">Продукт: {product.name}</span>}
          {promotion && <span className="tag">Акция: {promotion.title}</span>}
        </div>
      )}
    </article>
  );
}
