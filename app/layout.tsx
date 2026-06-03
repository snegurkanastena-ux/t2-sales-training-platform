import type { Metadata } from "next";
import "./globals.css";
import { Header } from "./_components/Header";
import { RevealRoot } from "./_components/RevealRoot";

export const metadata: Metadata = {
  title: "Академия продаж T2",
  description:
    "Интерактивная обучающая платформа для продавцов салонов T2 — модули, тренажёр диалогов, аналитика по салонам и сотрудникам.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <RevealRoot />
        <Header />
        <main>{children}</main>
        <footer className="app-footer">
          <div className="container row-between">
            <span>© {new Date().getFullYear()} Академия продаж T2 · внутренний MVP</span>
            <span>Демо-проект, не аффилирован с T2 Mobile</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
