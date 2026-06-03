import Link from "next/link";
import { notFound } from "next/navigation";
import { readDB } from "@/lib/db";
import { getEmployeeStats, levelTitle, levelProgress } from "@/lib/analytics";
import { StatTile } from "@/app/_components/StatTile";
import { ProgressBar } from "@/app/_components/ProgressBar";
import { KindBar } from "@/app/_components/KindBar";
import { Avatar } from "@/app/_components/Avatar";

interface Props {
  params: Promise<{ id: string }>;
}

const STATUS_LABEL = {
  not_started: "Не начат",
  in_progress: "В процессе",
  completed: "Пройден",
} as const;

export default async function EmployeePage({ params }: Props) {
  const { id } = await params;
  const stats = await getEmployeeStats(id);
  if (!stats) notFound();
  const db = await readDB();
  const lvl = levelProgress(stats.totalXp);
  const attempts = db.attempts
    .filter((a) => a.employeeId === id)
    .slice()
    .sort((a, b) => (a.attemptedAt < b.attemptedAt ? 1 : -1));

  const moduleStatusMap = new Map(
    db.progress
      .filter((p) => p.employeeId === id)
      .map((p) => [p.moduleId, p.status] as const)
  );

  return (
    <section className="section">
      <div className="container">
        <div className="row-flex" style={{ marginBottom: 18 }}>
          <Link href="/stats" className="btn btn-ghost btn-sm">
            ← Все сотрудники
          </Link>
          {stats.salon && (
            <Link href={`/stats/salons/${stats.salon.id}`} className="btn btn-ghost btn-sm">
              Салон: {stats.salon.name} →
            </Link>
          )}
        </div>

        <div className="card" style={{ padding: 32, marginBottom: 32 }}>
          <div className="row-between">
            <div className="row-flex" style={{ gap: 18 }}>
              <Avatar name={stats.employee.fullName} hue={stats.employee.avatarHue} size="lg" />
              <div>
                <h2 style={{ fontSize: "1.6rem" }}>{stats.employee.fullName}</h2>
                <p className="muted" style={{ marginTop: 4 }}>
                  {stats.salon?.name ?? "—"} · с {stats.employee.hiredAt} ·{" "}
                  <span className="tag tag-accent">{levelTitle(stats.level)}</span>
                  {stats.employee.isManual && (
                    <span className="tag" style={{ marginLeft: 8 }}>
                      добавлен вручную
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="stack" style={{ minWidth: 280 }}>
              <div className="row-between">
                <span className="muted">{lvl.current} XP</span>
                <span className="faint">до {lvl.nextAt}</span>
              </div>
              <ProgressBar value={lvl.pct} ariaLabel="Прогресс уровня" />
            </div>
          </div>
          {stats.badges.length > 0 && (
            <div className="tag-row" style={{ marginTop: 20 }}>
              {stats.badges.map((b) => (
                <span key={b} className="badge">
                  ⬢ {b}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="stat-grid" style={{ marginBottom: 32 }}>
          <StatTile label="XP всего" value={stats.totalXp} />
          <StatTile
            label="Лучших ответов"
            value={`${Math.round(stats.bestRate * 100)}%`}
            delta={`${stats.scoreByKind.best} из ${stats.attemptsCount}`}
          />
          <StatTile
            label="Прохождение модулей"
            value={`${stats.modulesCompleted}/${stats.modulesTotal}`}
            delta={`${stats.modulesInProgress} в процессе`}
          />
          <StatTile
            label="Слабых ответов"
            value={`${Math.round(stats.weakRate * 100)}%`}
            delta={`${stats.scoreByKind.weak} раз`}
          />
        </div>

        {stats.attemptsCount > 0 && (
          <div className="admin-section">
            <h3>Распределение ответов в тренажёре</h3>
            <div className="bar-list">
              <div className="bar-item">
                <div className="label-cell">Лучшие · {stats.scoreByKind.best}</div>
                <ProgressBar
                  value={stats.attemptsCount ? stats.scoreByKind.best / stats.attemptsCount : 0}
                  ariaLabel="Лучшие ответы"
                />
                <span className="num">{Math.round((stats.scoreByKind.best / Math.max(1, stats.attemptsCount)) * 100)}%</span>
              </div>
              <div className="bar-item">
                <div className="label-cell">Норма · {stats.scoreByKind.ok}</div>
                <ProgressBar
                  value={stats.attemptsCount ? stats.scoreByKind.ok / stats.attemptsCount : 0}
                  ariaLabel="Нормальные ответы"
                />
                <span className="num">{Math.round((stats.scoreByKind.ok / Math.max(1, stats.attemptsCount)) * 100)}%</span>
              </div>
              <div className="bar-item">
                <div className="label-cell">Слабые · {stats.scoreByKind.weak}</div>
                <ProgressBar
                  value={stats.attemptsCount ? stats.scoreByKind.weak / stats.attemptsCount : 0}
                  ariaLabel="Слабые ответы"
                />
                <span className="num">{Math.round((stats.scoreByKind.weak / Math.max(1, stats.attemptsCount)) * 100)}%</span>
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <KindBar scoreByKind={stats.scoreByKind} />
            </div>
          </div>
        )}

        <div className="admin-section">
          <h3>
            Прохождение модулей <span className="count">{db.modules.length}</span>
          </h3>
          <div className="list-table">
            {[...db.modules]
              .sort((a, b) => a.order - b.order)
              .map((m) => {
                const status = moduleStatusMap.get(m.id) ?? "not_started";
                return (
                  <div key={m.id} className="list-row">
                    <div className="info">
                      <span className="name">{m.title}</span>
                      <span className="meta">{m.description}</span>
                    </div>
                    <span className={`status-pill status-${status}`}>{STATUS_LABEL[status]}</span>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="admin-section">
          <h3>
            История попыток в тренажёре <span className="count">{attempts.length}</span>
          </h3>
          {attempts.length === 0 ? (
            <p className="muted">Сотрудник ещё не пробовал тренажёр диалогов.</p>
          ) : (
            <div className="list-table">
              {attempts.slice(0, 12).map((a) => {
                const sc = db.scenarios.find((s) => s.id === a.scenarioId);
                return (
                  <div key={a.id} className="list-row">
                    <div className="info">
                      <span className="name">{sc?.title ?? "Сценарий удалён"}</span>
                      <span className="meta">
                        {new Date(a.attemptedAt).toLocaleString("ru-RU")} · +{a.xpEarned} XP
                      </span>
                    </div>
                    <span className={`tag tag-${a.kind}`}>
                      {a.kind === "best" ? "Лучший" : a.kind === "ok" ? "Норма" : "Слабый"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
