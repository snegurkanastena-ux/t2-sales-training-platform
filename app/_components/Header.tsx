import Link from "next/link";
import { getCurrentSession } from "@/lib/session";
import { NavLink } from "./NavLink";
import { UserSession } from "./UserSession";

export async function Header() {
  const session = await getCurrentSession();
  const current = session?.employee ?? null;
  const salon = session?.salon ?? null;

  return (
    <header className="app-header">
      <div className="container">
        <Link href="/" className="brand" aria-label="T2 Академия">
          <span className="brand-mark">T2</span>
          <span className="brand-name">
            Академия <b>продаж</b>
          </span>
        </Link>
        <nav className="nav-links" aria-label="Основная навигация">
          <NavLink href="/" exact>
            Главная
          </NavLink>
          <NavLink href="/learn">Обучение</NavLink>
          <NavLink href="/stats">Аналитика</NavLink>
          <NavLink href="/admin">Администрирование</NavLink>
        </nav>
        <div className="nav-spacer" />
        <UserSession employee={current} salon={salon} />
      </div>
    </header>
  );
}
