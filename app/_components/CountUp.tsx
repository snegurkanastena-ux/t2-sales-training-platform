"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  /** Целевое значение. */
  value: number;
  /** Длительность анимации в миллисекундах. */
  duration?: number;
  prefix?: string;
  suffix?: string;
}

/**
 * Анимированный счётчик: при попадании в viewport считает от 0 до `value`.
 * Уважает `prefers-reduced-motion` — мгновенно показывает финальное число.
 */
export function CountUp({ value, duration = 1200, prefix = "", suffix = "" }: Props) {
  const [shown, setShown] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    const el = ref.current;
    if (!el) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      fired.current = true;
      // Уход в rAF, чтобы не триггерить каскадный рендер прямо из эффекта.
      const handle = requestAnimationFrame(() => setShown(value));
      return () => cancelAnimationFrame(handle);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !fired.current) {
          fired.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            setShown(Math.round(value * eased));
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {shown}
      {suffix}
    </span>
  );
}
