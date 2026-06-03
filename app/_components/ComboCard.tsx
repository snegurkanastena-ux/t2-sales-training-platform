import type { Combo } from "@/lib/types";

export function ComboCard({ combo }: { combo: Combo }) {
  return (
    <article className="card card-hover combo-card">
      <h3>{combo.title}</h3>
      <ul className="items">
        {combo.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
      <dl className="row">
        <dt>Кому</dt>
        <dd>{combo.audience}</dd>
        <dt>Польза клиенту</dt>
        <dd>{combo.customerBenefit}</dd>
        <dt>Почему легко предложить</dt>
        <dd>{combo.sellerNote}</dd>
      </dl>
    </article>
  );
}
