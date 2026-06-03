import { submitSaleProof } from "@/app/actions";
import type { DailyMission, Employee, SaleProof, Salon } from "@/lib/types";

interface Props {
  mission: DailyMission | null;
  employee: Employee;
  salon: Salon | null;
  proofs: SaleProof[];
}

const STATUS_LABEL: Record<SaleProof["status"], string> = {
  pending: "На проверке",
  approved: "Принято",
  rejected: "Отклонено",
};

function taskProgress(proofs: SaleProof[], taskId: string): number {
  return proofs
    .filter((proof) => proof.taskId === taskId && proof.status === "approved")
    .reduce((sum, proof) => sum + proof.quantity, 0);
}

export function DailyMissionPanel({ mission, employee, salon, proofs }: Props) {
  if (!mission || !salon) {
    return (
      <section className="section section-tight">
        <div className="container">
          <div className="mission-panel">
            <span className="eyebrow">Практика продаж</span>
            <h2>На сегодня миссия не назначена</h2>
            <p>Администратор может добавить дневные задания, чтобы связать обучение с реальными продажами.</p>
          </div>
        </div>
      </section>
    );
  }

  const completedTasks = mission.tasks.filter((task) => taskProgress(proofs, task.id) >= task.target).length;
  const missionDone = completedTasks === mission.tasks.length;

  return (
    <section className="section section-tight" id="daily-mission">
      <div className="container">
        <div className={`mission-panel${missionDone ? " mission-complete" : ""}`}>
          <div className="row-between">
            <div>
              <span className="eyebrow">Миссия на сегодня</span>
              <h2>{mission.title}</h2>
              <p>{mission.description}</p>
            </div>
            <div className="mission-score">
              <strong>{completedTasks}/{mission.tasks.length}</strong>
              <span>задач закрыто</span>
              <small>бонус +{mission.bonusXp} XP</small>
            </div>
          </div>

          {missionDone && (
            <div className="mission-congrats" role="status">
              Поздравляем! Миссия закрыта: теория превратилась в реальные продажи.
            </div>
          )}

          <div className="mission-grid">
            {mission.tasks.map((task) => {
              const approvedQty = taskProgress(proofs, task.id);
              const taskProofs = proofs.filter((proof) => proof.taskId === task.id);
              const done = approvedQty >= task.target;
              return (
                <article key={task.id} className="mission-task">
                  <div className="row-between">
                    <div>
                      <span className={`status-pill ${done ? "status-completed" : "status-in_progress"}`}>
                        {done ? "Выполнено" : `${approvedQty}/${task.target}`}
                      </span>
                      <h3>{task.title}</h3>
                    </div>
                    <span className="xp-pill">+{task.xpReward} XP</span>
                  </div>

                  {taskProofs.length > 0 && (
                    <div className="proof-list">
                      {taskProofs.map((proof) => (
                        <div key={proof.id} className={`proof-row proof-${proof.status}`}>
                          <span>{STATUS_LABEL[proof.status]}</span>
                          <strong>{proof.quantity} шт.</strong>
                          <span>{proof.amount ? `${proof.amount} ₽` : "без суммы"}</span>
                          {proof.receiptUrl ? (
                            <a href={proof.receiptUrl} target="_blank" rel="noreferrer">
                              чек
                            </a>
                          ) : (
                            <span>{proof.receiptLabel}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <form action={submitSaleProof} className="mission-form">
                    <input type="hidden" name="employeeId" value={employee.id} />
                    <input type="hidden" name="salonId" value={salon.id} />
                    <input type="hidden" name="missionId" value={mission.id} />
                    <input type="hidden" name="taskId" value={task.id} />
                    <div className="form-row">
                      <div className="field">
                        <label htmlFor={`${task.id}-qty`}>Количество</label>
                        <input id={`${task.id}-qty`} name="quantity" type="number" min={1} defaultValue={1} />
                      </div>
                      <div className="field">
                        <label htmlFor={`${task.id}-amount`}>Сумма</label>
                        <input id={`${task.id}-amount`} name="amount" type="number" min={0} placeholder="0" />
                      </div>
                    </div>
                    <div className="field">
                      <label htmlFor={`${task.id}-receipt`}>Чек</label>
                      <input id={`${task.id}-receipt`} name="receipt" type="file" accept="image/*,.pdf" />
                    </div>
                    <div className="field">
                      <label htmlFor={`${task.id}-comment`}>Комментарий</label>
                      <textarea id={`${task.id}-comment`} name="comment" rows={2} placeholder="Например: золотой номер, заявка одобрена, наушники в чеке" />
                    </div>
                    <button type="submit" className="btn btn-primary btn-sm">
                      Отправить на проверку
                    </button>
                  </form>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
