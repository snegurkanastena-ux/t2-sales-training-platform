"use client";

import { useState } from "react";

interface Voice {
  id: string;
  label: string;
  quotes: { author: string; salon: string; text: string }[];
}

const VOICES: Voice[] = [
  {
    id: "seller",
    label: "Продавцы",
    quotes: [
      {
        author: "Анна, продавец",
        salon: "T2 Пиллар · Кудымкар",
        text:
          "Раньше боялась предлагать аксессуары — казалось, что навязываю. Теперь у меня есть фразы, которые звучат как забота, и клиенты сами соглашаются на стекло.",
      },
      {
        author: "Артём, продавец",
        salon: "T2 ТЦ ЦУМ · Соликамск",
        text:
          "Тренажёр диалогов поменял главное — я перестал спорить с возражениями. Соглашаюсь, уточняю, перевожу на пользу. И сделок стало заметно больше.",
      },
      {
        author: "Камилла, новичок",
        salon: "T2 ТЦ Миллениум · Березники",
        text:
          "За первую неделю прошла модуль «Любовь к продукту» и шесть сценариев тренажёра. На смене больше не теряюсь — у меня в голове готовые комбо.",
      },
    ],
  },
  {
    id: "manager",
    label: "Управляющие ТТ",
    quotes: [
      {
        author: "Светлана, управляющая",
        salon: "T2 Универсал Семья · Березники",
        text:
          "Раньше мне нужен был час, чтобы понять, кто из новичков «плавает» по продуктам. Сейчас открываю дашборд салона — вижу слабые места команды за минуту.",
      },
      {
        author: "Олег, директор кластера",
        salon: "Соликамск · 3 ТТ",
        text:
          "Раньше делали корпоративный тренинг раз в квартал. Теперь обучение встроено в смену: 5 минут утром на тренажёре — и продавцы заходят в смену в тонусе.",
      },
    ],
  },
  {
    id: "hr",
    label: "HR и тренеры",
    quotes: [
      {
        author: "Лидия, тренер",
        salon: "Региональный офис",
        text:
          "Главное — единый стандарт консультации. Все 10 ТТ работают по одной логике, и я больше не объясняю заново «как продавать через пользу» каждому новичку.",
      },
      {
        author: "Марина, HR-специалист",
        salon: "Региональный офис",
        text:
          "Адаптация новичка теперь занимает 30 дней вместо квартала. План развития формируется автоматически — мне остаётся только сопровождать.",
      },
    ],
  },
];

export function VoiceTabs() {
  const [activeId, setActiveId] = useState(VOICES[0].id);
  const active = VOICES.find((v) => v.id === activeId) ?? VOICES[0];

  return (
    <div className="voice-block">
      <div className="voice-tabs" role="tablist" aria-label="Голос пилота">
        {VOICES.map((v) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={v.id === activeId}
            className={`voice-tab${v.id === activeId ? " active" : ""}`}
            onClick={() => setActiveId(v.id)}
          >
            {v.label}
            <span className="voice-tab-count">{v.quotes.length}</span>
          </button>
        ))}
      </div>
      <div className="voice-grid">
        {active.quotes.map((q, i) => (
          <article key={`${active.id}-${i}`} className="voice-card">
            <p className="voice-text">«{q.text}»</p>
            <div className="voice-meta">
              <span className="voice-author">{q.author}</span>
              <span className="voice-salon">{q.salon}</span>
            </div>
          </article>
        ))}
      </div>
      <p className="voice-note">
        Фразы — собирательные образы пилотных салонов и кластеров. Реальные отзывы появляются в
        первые две недели после запуска.
      </p>
    </div>
  );
}
