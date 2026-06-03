import Link from "next/link";
import { notFound } from "next/navigation";
import { getSalonStats, levelTitle } from "@/lib/analytics";
import { StatTile } from "@/app/_components/StatTile";
import { ProgressBar } from "@/app/_components/ProgressBar";
import { KindBar } from "@/app/_components/KindBar";
import { Avatar } from "@/app/_components/Avatar";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SalonPage({ params }: Props) {
  const { id } = await params;
  const data = await getSalonStats(id);
  if (!data) notFound();

  return (
    <section className="section">
      <div className="container">
        <div className="row-flex" style={{ marginBottom: 18 }}>
          <Link href="/stats" className="btn btn-ghost btn-sm">
            ← Все салоны
          </Link>
        </div>

        <div className="section-head">
          <span className="eyebrow">Салон · {data.salon.city}</span>
          <h2>{data.salon.name}</h2>
          <p>{data.salon.address}</p>
        </div>

        <div className="stat-grid" style={{ marginBottom: 36 }}>
          <StatTile label="Сотрудников" value={data.employees.length} />
          <StatTile label="Средний XP" value={data.avgXp} delta={`Всего: ${data.totalXp} XP`} />
          <StatTile
            label="Лучших ответов"
            value={`${Math.round(data.avgBestRate * 100)}%`}
            delta={`${data.totalAttempts} попыток`}
          />
          <StatTile
            label="Прохождение модулей"
            value={`${Math.round(data.modulesCompletionRate * 100)}%`}
            delta="по салону"
          />
        </div>

        <div className="admin-section">
          <h3>
            Сотрудники салона <span className="count">{data.employees.length}</span>
          </h3>
          {data.employees.length === 0 ? (
            <p className="muted">В этой ТТ пока нет сотрудников.</p>
          ) : (
            <div className="leaderboard">
              {data.employees.map((e, i) => (
                <Link
                  key={e.employee.id}
                  href={`/stats/employees/${e.employee.id}`}
                  className="leader-row"
                  style={{ textDecoration: "none" }}
                >
                  <span className="rank">#{i + 1}</span>
                  <div className="who">
                    <Avatar name={e.employee.fullName} hue={e.employee.avatarHue} size="sm" />
                    <div>
                      <div className="name">
                        {e.employee.fullName}
                        {e.employee.isManual && (
                          <span className="tag" style={{ marginLeft: 8 }}>
                            добавлен вручную
                          </span>
                        )}
                      </div>
                      <div className="meta">{levelTitle(e.level)} · с {e.employee.hiredAt}</div>
                    </div>
                  </div>
                  <span className="num">{e.totalXp} XP</span>
                  <span className="num">
                    {e.modulesCompleted}/{e.modulesTotal}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {data.employees.some((e) => e.attemptsCount > 0) && (
          <div className="admin-section">
            <h3>Качество ответов</h3>
            <div className="bar-list">
              {data.employees
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

        {data.employees.length > 0 && (
          <div className="admin-section">
            <h3>Прогресс модулей</h3>
            <div className="bar-list">
              {data.employees.map((e) => (
                <div key={e.employee.id} className="bar-item">
                  <div className="label-cell">
                    <span>{e.employee.fullName}</span>
                  </div>
                  <ProgressBar
                    value={e.modulesTotal ? e.modulesCompleted / e.modulesTotal : 0}
                    ariaLabel={`Прогресс модулей ${e.employee.fullName}`}
                  />
                  <span className="num">
                    {e.modulesCompleted}/{e.modulesTotal}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
