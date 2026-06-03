import Link from "next/link";
import { readDB } from "@/lib/db";
import { getCurrentSession } from "@/lib/session";
import { getEmployeeStats, levelTitle, levelProgress } from "@/lib/analytics";
import { Trainer } from "@/app/_components/Trainer";
import { ModuleCard } from "@/app/_components/ModuleCard";
import { ComboCard } from "@/app/_components/ComboCard";
import { ProductsExplorer } from "@/app/_components/ProductsExplorer";
import { ProgressBar } from "@/app/_components/ProgressBar";
import { Avatar } from "@/app/_components/Avatar";
import { PromotionCard } from "@/app/_components/PromotionCard";
import { SalesScriptCard } from "@/app/_components/SalesScriptCard";
import { ObjectionCard } from "@/app/_components/ObjectionCard";
import { MaterialCard } from "@/app/_components/MaterialCard";
import { DailyMissionPanel } from "@/app/_components/DailyMissionPanel";
import { MascotGuide } from "@/app/_components/MascotGuide";

function isActivePromotion(now: Date, validFrom: string, validTo: string): boolean {
  const from = validFrom ? new Date(validFrom) : null;
  const to = validTo ? new Date(validTo) : null;
  if (from && now < from) return false;
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    if (now > end) return false;
  }
  return true;
}

export default async function LearnPage() {
  const db = await readDB();
  const session = await getCurrentSession();
  const employee = session?.employee ?? null;

  if (!employee) {
    return (
      <section className="section section-tight">
        <div className="container">
          <div className="empty-state">
            <span className="hero-eyebrow">Доступ к обучению</span>
            <h1 className="login-title">Сначала выберите торговую точку и сотрудника</h1>
            <p className="muted" style={{ maxWidth: 560, margin: "12px auto 0" }}>
              Чтобы платформа сохраняла ваш прогресс, начисляла XP и показывала актуальные акции
              и подсказки — войдите как сотрудник салона.
            </p>
            <div className="row-flex" style={{ marginTop: 28, justifyContent: "center" }}>
              <Link href="/login" className="btn btn-primary">
                Перейти ко входу
              </Link>
              <Link href="/" className="btn btn-ghost">
                На главную
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const stats = await getEmployeeStats(employee.id);
  const progress = levelProgress(stats?.totalXp ?? 0);
  const salon = session?.salon ?? null;
  const moduleProgress = new Map<string, "not_started" | "in_progress" | "completed">();
  for (const p of db.progress.filter((p) => p.employeeId === employee.id)) {
    moduleProgress.set(p.moduleId, p.status);
  }

  const now = new Date();
  const activePromotions = db.promotions.filter((p) => isActivePromotion(now, p.validFrom, p.validTo));
  const today = now.toISOString().slice(0, 10);
  const dailyMission =
    db.dailyMissions.find((m) => m.date === today && (!salon || m.salonIds.length === 0 || m.salonIds.includes(salon.id))) ??
    db.dailyMissions.find((m) => !salon || m.salonIds.length === 0 || m.salonIds.includes(salon.id)) ??
    null;
  const missionProofs = db.saleProofs.filter((proof) => proof.employeeId === employee.id && proof.missionId === dailyMission?.id);
  const focusProducts = activePromotions
    .flatMap((p) => p.productIds)
    .map((id) => db.products.find((pr) => pr.id === id))
    .filter((p): p is (typeof db.products)[number] => Boolean(p))
    .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i);

  return (
    <>
      {/* Профиль ученика */}
      <section className="section section-tight">
        <div className="container">
          <div className="card" style={{ padding: 32 }}>
            <div className="row-between">
              <div className="row-flex" style={{ gap: 18 }}>
                <Avatar name={employee.fullName} hue={employee.avatarHue} size="lg" />
                <div>
                  <h2 style={{ fontSize: "1.6rem" }}>{employee.fullName}</h2>
                  <p className="muted" style={{ marginTop: 4 }}>
                    {salon?.name ?? "—"}
                    {salon?.city && <span className="faint"> · {salon.city}</span>} ·{" "}
                    <span className="tag tag-accent">{levelTitle(progress.level)}</span>
                    {employee.isManual && (
                      <span className="tag" style={{ marginLeft: 8 }}>
                        добавлен вручную
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="stack" style={{ minWidth: 280 }}>
                <div className="row-between">
                  <span className="muted">{progress.current} XP</span>
                  <span className="faint">до уровня · {progress.nextAt}</span>
                </div>
                <ProgressBar value={progress.pct} ariaLabel="Прогресс уровня" />
                <div className="row-flex">
                  <span className="xp-pill">
                    {stats?.modulesCompleted ?? 0} / {db.modules.length} модулей
                  </span>
                  <span className="xp-pill">
                    {stats?.attemptsCount ?? 0} попыток в тренажёре
                  </span>
                </div>
              </div>
            </div>
            {stats && stats.badges.length > 0 && (
              <div className="tag-row" style={{ marginTop: 20 }}>
                {stats.badges.map((b) => (
                  <span key={b} className="badge">
                    ⬢ {b}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <MascotGuide compact />

      <DailyMissionPanel mission={dailyMission} employee={employee} salon={salon} proofs={missionProofs} />

      {/* Актуальные акции */}
      {activePromotions.length > 0 && (
        <section className="section section-tight" id="promotions">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">Актуальные акции</span>
              <h2>Что выгодно предложить клиенту прямо сейчас</h2>
              <p>
                Список собирается из админки и фильтруется по дате — вы видите только то, что сегодня
                действительно действует.
              </p>
            </div>
            <div className="grid grid-2">
              {activePromotions.map((p) => (
                <PromotionCard key={p.id} promotion={p} products={db.products} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Что сегодня продавать */}
      {focusProducts.length > 0 && (
        <section className="section section-tight" id="focus">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">Что сегодня продавать</span>
              <h2>Продукты, привязанные к активным акциям</h2>
              <p>
                Эти продукты сейчас идут со скидкой или в связках — на них стоит фокусироваться в
                диалогах с клиентом.
              </p>
            </div>
            <div className="grid grid-3">
              {focusProducts.map((p) => (
                <article key={p.id} className="card card-hover focus-card">
                  <h3>{p.name}</h3>
                  <p>{p.plainExplanation}</p>
                  {p.tags.length > 0 && (
                    <div className="tag-row">
                      {p.tags.map((t) => (
                        <span key={t} className="tag">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Тренажёр */}
      <section className="section section-tight">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Тренажёр диалогов</span>
            <h2>Один клиент — три ответа. Учимся продавать через пользу</h2>
            <p>
              Выберите вариант ответа продавца. Платформа объяснит, почему один работает, а другой —
              нет. За лучший ответ начисляется XP.
            </p>
          </div>
          {db.scenarios.length > 0 ? (
            <Trainer
              scenarios={db.scenarios}
              employeeId={employee.id}
              employeeName={employee.fullName}
            />
          ) : (
            <div className="trainer">
              <p>Сценарии тренажёра пока не добавлены. Их можно создать в разделе администрирования.</p>
            </div>
          )}
        </div>
      </section>

      {/* Модули */}
      <section className="section" id="modules">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Модули</span>
            <h2>Маршрут обучения от любви к продукту до плана развития</h2>
            <p>
              Каждый модуль — короткий, с понятной целью и примером результата. Прогресс
              сохраняется автоматически.
            </p>
          </div>
          <div className="grid grid-3">
            {[...db.modules]
              .sort((a, b) => a.order - b.order)
              .map((m) => (
                <ModuleCard
                  key={m.id}
                  module={m}
                  employeeId={employee.id}
                  status={moduleProgress.get(m.id) ?? "not_started"}
                />
              ))}
          </div>
        </div>
      </section>

      {/* Подсказки по продуктам */}
      <section className="section" id="products">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Подсказки по продуктам</span>
            <h2>SIM-карты, тарифы, смартфоны, аксессуары, камеры, Wink, колонки, услуги</h2>
            <p>
              Каждая карточка отвечает на вопросы клиента: «кому подходит», «какую проблему решает»,
              «как объяснить простыми словами», и даёт готовые аргументы и ответ на типовое возражение.
            </p>
          </div>
          <ProductsExplorer products={db.products} />
        </div>
      </section>

      {/* Скрипты продаж */}
      {db.salesScripts.length > 0 && (
        <section className="section" id="scripts">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">Скрипты продаж</span>
              <h2>Правильная фраза в нужный момент</h2>
              <p>
                Под типовые ситуации в салоне — что сказать, что не говорить и почему. Список
                расширяется через админку.
              </p>
            </div>
            <div className="grid grid-2">
              {db.salesScripts.map((s) => (
                <SalesScriptCard key={s.id} script={s} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Возражения */}
      {db.objections.length > 0 && (
        <section className="section" id="objections">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">Ответы на возражения</span>
              <h2>«Дорого», «подумаю», «у меня уже есть» — есть готовая реакция</h2>
              <p>
                Три уровня ответа на каждое возражение: что лучше не говорить, что нормально и что —
                эталон.
              </p>
            </div>
            <div className="grid grid-2">
              {db.objections.map((o) => (
                <ObjectionCard key={o.id} objection={o} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Комбо */}
      <section className="section" id="combos">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Комбо-продажи</span>
            <h2>Готовые связки под типовые сценарии</h2>
            <p>
              Каждая связка — это набор, который логично продаётся вместе. Продавцу не нужно
              импровизировать.
            </p>
          </div>
          <div className="grid grid-2">
            {db.combos.map((c) => (
              <ComboCard key={c.id} combo={c} />
            ))}
          </div>
        </div>
      </section>

      {/* Обучающие материалы */}
      {db.learningMaterials.length > 0 && (
        <section className="section" id="materials">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">Обучающие материалы</span>
              <h2>Чек-листы, гайды и советы — всё в одном месте</h2>
              <p>
                Материалы добавляет администратор и привязывает к продуктам или акциям. Здесь они
                автоматически появляются у вас.
              </p>
            </div>
            <div className="grid grid-2">
              {db.learningMaterials.map((m) => (
                <MaterialCard
                  key={m.id}
                  material={m}
                  products={db.products}
                  promotions={db.promotions}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
