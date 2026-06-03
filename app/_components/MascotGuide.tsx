import Link from "next/link";

type MascotKind = "panda" | "sloth" | "owl";

interface Mascot {
  kind: MascotKind;
  name: string;
  title: string;
  line: string;
  href: string;
  action: string;
}

const MASCOTS: Mascot[] = [
  {
    kind: "panda",
    name: "Панда Питч",
    title: "Мягко ведет ко входу",
    line: "Не надо героизма. Сначала выбираем себя, потом уже спасаем чек от одиночной SIM-карты.",
    href: "/login",
    action: "Войти и выбрать себя",
  },
  {
    kind: "sloth",
    name: "Ленивец Лид",
    title: "Не спешит, но закрывает план",
    line: "Медленно листаем, уверенно продаем. Миссия дня сама подскажет, какой чек сегодня приручить.",
    href: "/learn#daily-mission",
    action: "Открыть миссию",
  },
  {
    kind: "owl",
    name: "Сова KPI",
    title: "Следит за турниром",
    line: "Вижу все: кто учится, кто грузит чеки, а кто прячется за фразой «клиент просто смотрел».",
    href: "/stats",
    action: "Смотреть рейтинг",
  },
];

function MascotArt({ kind }: { kind: MascotKind }) {
  const colors = {
    panda: { main: "#3db7ff", second: "#8d6bff", body: "#f7fbff", dark: "#1b2030", accent: "#8d6bff" },
    sloth: { main: "#4ade80", second: "#38d6c5", body: "#c7a27a", dark: "#5b3c2e", accent: "#4ade80" },
    owl: { main: "#facc15", second: "#3db7ff", body: "#9a6bff", dark: "#2a2040", accent: "#facc15" },
  }[kind];

  return (
    <svg className="mascot-art" viewBox="0 0 180 180" role="img" aria-label="Игровой животный персонаж Академии">
      <defs>
        <linearGradient id={`cape-${kind}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor={colors.main} />
          <stop offset="100%" stopColor={colors.second} />
        </linearGradient>
        <radialGradient id={`body-${kind}`} cx="35%" cy="25%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="55%" stopColor={colors.body} />
          <stop offset="100%" stopColor={colors.second} stopOpacity="0.85" />
        </radialGradient>
      </defs>
      <circle cx="90" cy="90" r="78" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" />
      <ellipse cx="90" cy="126" rx="50" ry="18" fill="#000" opacity="0.25" />
      <path d="M56 92 C40 103 33 121 32 145 C51 135 69 131 90 132 C111 131 129 135 148 145 C147 121 140 103 124 92 Z" fill={`url(#cape-${kind})`} opacity="0.92" />
      {kind === "panda" && (
        <>
          <circle cx="62" cy="53" r="18" fill={colors.dark} />
          <circle cx="118" cy="53" r="18" fill={colors.dark} />
          <circle cx="90" cy="76" r="42" fill={`url(#body-${kind})`} />
          <ellipse cx="76" cy="75" rx="14" ry="18" fill={colors.dark} />
          <ellipse cx="104" cy="75" rx="14" ry="18" fill={colors.dark} />
          <circle cx="78" cy="73" r="4" fill="#fff" />
          <circle cx="102" cy="73" r="4" fill="#fff" />
          <ellipse cx="90" cy="88" rx="8" ry="6" fill={colors.dark} />
          <path d="M80 98 Q90 107 101 98" fill="none" stroke={colors.dark} strokeWidth="4" strokeLinecap="round" />
          <path d="M62 116 C46 122 38 132 32 146" fill="none" stroke={colors.accent} strokeWidth="10" strokeLinecap="round" />
        </>
      )}
      {kind === "sloth" && (
        <>
          <circle cx="90" cy="74" r="42" fill={`url(#body-${kind})`} />
          <path d="M61 68 C68 49 112 49 119 68 C110 64 101 63 90 63 C79 63 70 64 61 68 Z" fill="#ead7bc" opacity="0.95" />
          <path d="M71 72 C80 65 100 65 109 72" fill="none" stroke={colors.dark} strokeWidth="10" strokeLinecap="round" opacity="0.75" />
          <circle cx="78" cy="75" r="4" fill="#141822" />
          <circle cx="102" cy="75" r="4" fill="#141822" />
          <path d="M82 92 Q90 98 99 92" fill="none" stroke="#141822" strokeWidth="4" strokeLinecap="round" />
          <path d="M55 108 C36 92 39 68 54 54" fill="none" stroke={colors.dark} strokeWidth="11" strokeLinecap="round" />
          <path d="M126 108 C145 92 142 68 127 54" fill="none" stroke={colors.dark} strokeWidth="11" strokeLinecap="round" />
        </>
      )}
      {kind === "owl" && (
        <>
          <path d="M51 74 C51 40 78 34 90 52 C102 34 129 40 129 74 C129 105 111 121 90 121 C69 121 51 105 51 74 Z" fill={`url(#body-${kind})`} />
          <path d="M57 47 L73 31 L89 53 Z" fill={colors.dark} />
          <path d="M123 47 L107 31 L91 53 Z" fill={colors.dark} />
          <circle cx="76" cy="76" r="18" fill="#fff7c2" />
          <circle cx="104" cy="76" r="18" fill="#fff7c2" />
          <circle cx="76" cy="76" r="7" fill="#141822" />
          <circle cx="104" cy="76" r="7" fill="#141822" />
          <path d="M86 91 L94 91 L90 101 Z" fill={colors.accent} />
          <path d="M63 108 C75 118 105 118 117 108" fill="none" stroke="#fff7c2" strokeWidth="5" strokeLinecap="round" opacity="0.8" />
        </>
      )}
      <path d="M124 93 C144 94 153 101 159 116" fill="none" stroke={colors.main} strokeWidth="10" strokeLinecap="round" />
      <path d="M157 116 L144 109 M157 116 L149 126" fill="none" stroke={colors.main} strokeWidth="7" strokeLinecap="round" />
      <circle cx="139" cy="42" r="6" fill={colors.accent} opacity="0.9" />
      <circle cx="43" cy="41" r="4" fill={colors.main} opacity="0.8" />
    </svg>
  );
}

export function MascotGuide({ compact = false }: { compact?: boolean }) {
  return (
    <section className={compact ? "mascot-section mascot-section-compact" : "section mascot-section"}>
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Игровые подсказки</span>
          <h2>Команда Академии подсказывает, куда нажать дальше</h2>
          <p>
            Вместо сухих блоков — маленькие персонажи-наставники. Они ведут продавца по шагам:
            зайти, выполнить миссию, загрузить чек и подняться в рейтинге.
          </p>
        </div>
        <div className="mascot-grid">
          {MASCOTS.map((mascot) => (
            <article key={mascot.kind} className={`mascot-card mascot-${mascot.kind}`}>
              <MascotArt kind={mascot.kind} />
              <div className="mascot-copy">
                <span className="stripe">{mascot.title}</span>
                <h3>{mascot.name}</h3>
                <p>{mascot.line}</p>
                <Link href={mascot.href} className="btn btn-primary btn-sm">
                  {mascot.action}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
