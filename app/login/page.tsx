import Link from "next/link";
import { redirect } from "next/navigation";
import { readDB } from "@/lib/db";
import { getCurrentEmployee } from "@/lib/session";
import { LoginCard } from "@/app/_components/LoginCard";

export const metadata = {
  title: "Вход · Академия продаж T2",
};

export default async function LoginPage() {
  const current = await getCurrentEmployee();
  if (current) {
    redirect("/learn");
  }
  const db = await readDB();
  const employees = db.employees.filter((e) => !e.isManual);

  return (
    <section className="section section-tight">
      <div className="container">
        <div className="login-shell">
          <div className="login-side">
            <span className="hero-eyebrow">Внутренний доступ</span>
            <h1 className="login-title">
              Войдите как <span className="accent">сотрудник салона</span>
            </h1>
            <p className="muted" style={{ marginTop: 12 }}>
              Платформа сохраняет ваш прогресс по обучению, отвечает на запросы клиентов
              готовыми скриптами и собирает аналитику по вашему салону. Авторизация — через
              выбор ТТ и ФИО, без паролей.
            </p>
            <ul className="login-bullets">
                          <li>10 торговых точек в Кунгуре, Березниках и Соликамске</li>
              <li>Если вашего ФИО ещё нет в списке — добавим вручную</li>
              <li>Прогресс и XP сохраняются между визитами на платформу</li>
            </ul>
            <div className="row-flex" style={{ marginTop: 24 }}>
              <Link href="/" className="btn btn-ghost btn-sm">
                ← На главную
              </Link>
            </div>
          </div>
          <LoginCard salons={db.salons} employees={employees} />
        </div>
      </div>
    </section>
  );
}
