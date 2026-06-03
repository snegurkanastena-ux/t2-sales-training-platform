import Link from "next/link";
import { getPlatformStats, levelTitle } from "@/lib/analytics";
import { StatTile } from "@/app/_components/StatTile";
import { ProgressBar } from "@/app/_components/ProgressBar";
import { KindBar } from "@/app/_components/KindBar";
import { Avatar } from "@/app/_components/Avatar";

function rankClass(rank: number): string {
  if (rank === 1) return "rank gold";
  if (rank === 2) return "rank silver";
  if (rank === 3) return "rank bronze";
  return "rank";
}

export default async function StatsPage() {
  const data = await getPlatformStats();
  const bestRateOverall = data.totals.attempts ? data.totals.bestAnswers / data.totals.attempts : 0;

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Аналитика</span>
          <h2>Как идёт обучение в салонах и у сотрудников</h2>
          <p>
            Все цифры считаются в реальном времени по результатам прохождения модулей и тренажёра
            диалогов.
          </p>
        </div>

        <div className="stat-grid" style={{ marginBottom: 36 }}>
          <StatTile label="Активных продавцов" value={data.totals.employees} />
          <StatTile label="Подтвержденных продаж" value={data.totals.approvedSales} />
          <StatTile label="Закрытых миссий" value={data.totals.completedMissions} />
          <StatTile
            label="Лучших ответов"
            value={`${Math.round(bestRateOverall * 100)}%`}
            delta={`${data.totals.bestAnswers} из ${data.totals.attempts} попыток`}
          />
          <StatTile label="Завершённых модулей" value={data.totals.completedModules} />
          <StatTile label="Салонов в пилоте" value={data.totals.salons} />
        </div>

        {/* Рейтинг салонов */}
        <div className="admin-section">
          <h3>
            Рейтинг салонов <span className="count">{data.topSalons.length}</span>
          </h3>
          <p className="muted" style={{ marginBottom: 18 }}>
            Сортировка по среднему XP на сотрудника. Кликните по строке, чтобы провалиться в
            деталь по салону.
          </p>
          <div className="bar-list">
            {data.topSalons.map((s) => {
              const max = data.topSalons[0]?.avgXp || 1;
              return (
                <Link
                  key={s.salon.id}
                  href={`/stats/salons/${s.salon.id}`}
                  className="bar-item"
                  style={{ textDecoration: "none" }}
                >
                  <div className="label-cell">
                    <strong>{s.salon.name}</strong>
                    <span className="faint" style={{ fontSize: 12 }}>
                      · {s.salon.city}
                    </span>
                  </div>
                  <ProgressBar value={s.avgXp / max} ariaLabel={`Средний XP салона ${s.salon.name}`} />
                  <span className="num">{s.avgXp} XP</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Топ-сотрудники */}
        <div className="admin-section">
          <h3>
            Топ-сотрудники <span className="count">{data.topEmployees.length}</span>
          </h3>
          {data.topEmployees.length === 0 ? (
            <p className="muted">Сотрудники ещё не зарегистрированы или нет попыток в тренажёре.</p>
          ) : (
            <div className="leaderboard">
              {data.topEmployees.map((e, i) => (
                <Link
                  key={e.employee.id}
                  href={`/stats/employees/${e.employee.id}`}
                  className="leader-row"
                  style={{ textDecoration: "none" }}
                >
                  <span className={rankClass(i + 1)}>#{i + 1}</span>
                  <div className="who">
                    <Avatar name={e.employee.fullName} hue={e.employee.avatarHue} size="sm" />
                    <div>
                      <div className="name">{e.employee.fullName}</div>
                      <div className="meta">
                        {e.salon?.name ?? "—"} · {levelTitle(e.level)}
                      </div>
                    </div>
                  </div>
                  <span className="num">{e.totalXp} XP</span>
                  <span className="num">
                    {e.modulesCompleted}/{e.modulesTotal} модулей
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Качество ответов в тренажёре */}
        {data.topEmployees.some((e) => e.attemptsCount > 0) && (
          <div className="admin-section">
            <h3>Качество ответов в тренажёре</h3>
            <p className="muted" style={{ marginBottom: 18 }}>
              Распределение «лучший / нормальный / слабый» по каждому продавцу — основа для точечного
              наставничества.
            </p>
            <div className="bar-list">
              {data.topEmployees
                .filter((e) => e.attemptsCount > 0)
                .map((e) => (
                  <div key={e.employee.id} className="bar-item">
                    <div className="label-cell">
                      <Avatar name={e.employee.fullName} hue={e.employee.avatarHue} size="sm" />
                      <span>{e.employee.fullName}</span>
                    </div>
                    <KindBar scoreByKind={e.scoreByKind} />
                    <span className="num">{Math.round(e.bestRate * 100)}%</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
