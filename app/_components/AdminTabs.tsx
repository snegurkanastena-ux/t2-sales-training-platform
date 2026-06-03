"use client";

import { useState, type ReactNode } from "react";

interface Tab {
  id: string;
  label: string;
  count?: number;
  content: ReactNode;
}

interface Props {
  tabs: Tab[];
  initial?: string;
}

export function AdminTabs({ tabs, initial }: Props) {
  const [active, setActive] = useState(initial ?? tabs[0]?.id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div>
      <div className="admin-tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={t.id === active}
            className={`admin-tab${t.id === active ? " active" : ""}`}
            onClick={() => setActive(t.id)}
          >
            {t.label}
            {typeof t.count === "number" && (
              <span style={{ marginLeft: 8, opacity: 0.6, fontSize: 12 }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>
      <div role="tabpanel">{current?.content}</div>
    </div>
  );
}
