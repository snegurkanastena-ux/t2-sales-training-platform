"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/lib/types";

interface Props {
  products: Product[];
}

export function ProductsExplorer({ products }: Props) {
  const tags = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.tags.forEach((t) => set.add(t)));
    return ["Все", ...[...set].sort()];
  }, [products]);

  const [active, setActive] = useState("Все");
  const filtered = active === "Все" ? products : products.filter((p) => p.tags.includes(active));

  return (
    <div>
      <div className="filter-row" role="tablist" aria-label="Фильтр продуктов">
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            role="tab"
            aria-selected={active === tag}
            className={`filter-chip${active === tag ? " active" : ""}`}
            onClick={() => setActive(tag)}
          >
            {tag}
          </button>
        ))}
      </div>
      <div className="grid grid-3">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
        {filtered.length === 0 && (
          <p className="muted">По выбранному фильтру продуктов нет.</p>
        )}
      </div>
    </div>
  );
}
