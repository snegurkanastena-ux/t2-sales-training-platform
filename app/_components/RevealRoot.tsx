"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Глобальный наблюдатель: добавляет класс `.reveal-in` всем элементам с классом
 * `.reveal`, как только они попадают в viewport. Если пользователь предпочитает
 * уменьшение анимации — все элементы помечаются как «уже показанные» сразу.
 *
 * Подключается один раз в `app/layout.tsx`. На смену маршрута скрипт перезапускается.
 */
export function RevealRoot() {
  const pathname = usePathname();

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(".reveal:not(.reveal-in)")
    );
    if (elements.length === 0) return;

    if (reduceMotion) {
      for (const el of elements) el.classList.add("reveal-in");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-in");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
