import "server-only";
import { readDB } from "./db";
import type { AnswerKind, DBShape, Employee, Salon } from "./types";

export interface EmployeeStats {
  employee: Employee;
  salon: Salon | null;
  totalXp: number;
  trainingXp: number;
  salesXp: number;
  approvedSalesCount: number;
  completedMissions: number;
  attemptsCount: number;
  bestRate: number; // 0..1
  weakRate: number; // 0..1
  modulesCompleted: number;
  modulesInProgress: number;
  modulesTotal: number;
  level: number;
  badges: string[];
  scoreByKind: Record<AnswerKind, number>;
}

export interface SalonStats {
  salon: Salon;
  employees: EmployeeStats[];
  totalXp: number;
  avgXp: number;
  topEmployee: EmployeeStats | null;
  totalAttempts: number;
  avgBestRate: number;
  modulesCompletionRate: number; // 0..1
}

export interface PlatformStats {
  totals: {
    employees: number;
    salons: number;
    attempts: number;
    bestAnswers: number;
    completedModules: number;
    approvedSales: number;
    completedMissions: number;
  };
  topEmployees: EmployeeStats[];
  topSalons: SalonStats[];
}

function levelFromXp(xp: number): number {
  if (xp >= 600) return 6;
  if (xp >= 400) return 5;
  if (xp >= 250) return 4;
  if (xp >= 150) return 3;
  if (xp >= 70) return 2;
  if (xp >= 1) return 1;
  return 0;
}

function badgesFor(stats: Omit<EmployeeStats, "badges" | "level">): string[] {
  const out: string[] = [];
  if (stats.scoreByKind.best >= 3) out.push("Продаёт через пользу");
  if (stats.modulesCompleted >= 3) out.push("Стабильный ученик");
  if (stats.bestRate >= 0.7 && stats.attemptsCount >= 3) out.push("Эталонный диалог");
  if (stats.attemptsCount >= 5) out.push("Закалён в практике");
  if (stats.approvedSalesCount >= 1) out.push("Первый чек");
  if (stats.approvedSalesCount >= 5) out.push("Продает в поле");
  if (stats.completedMissions >= 1) out.push("Миссия закрыта");
  if (stats.modulesCompleted === stats.modulesTotal && stats.modulesTotal > 0) out.push("Полный курс");
  return out;
}

function buildEmployeeStats(db: DBShape, employee: Employee): EmployeeStats {
  const attempts = db.attempts.filter((a) => a.employeeId === employee.id);
  const trainingXp = attempts.reduce((sum, a) => sum + a.xpEarned, 0);
  const salesXp = db.rewardEvents
    .filter((event) => event.employeeId === employee.id)
    .reduce((sum, event) => sum + event.xp, 0);
  const totalXp = trainingXp + salesXp;
  const approvedSalesCount = db.saleProofs.filter((p) => p.employeeId === employee.id && p.status === "approved").length;
  const completedMissions = db.rewardEvents.filter((event) => event.employeeId === employee.id && event.kind === "mission_bonus").length;
  const scoreByKind: Record<AnswerKind, number> = { best: 0, ok: 0, weak: 0 };
  for (const a of attempts) scoreByKind[a.kind]++;

  const moduleEntries = db.progress.filter((p) => p.employeeId === employee.id);
  const modulesCompleted = moduleEntries.filter((p) => p.status === "completed").length;
  const modulesInProgress = moduleEntries.filter((p) => p.status === "in_progress").length;

  const partial = {
    employee,
    salon: db.salons.find((s) => s.id === employee.salonId) ?? db.salons.find((s) => employee.salonIds.includes(s.id)) ?? null,
    totalXp,
    trainingXp,
    salesXp,
    approvedSalesCount,
    completedMissions,
    attemptsCount: attempts.length,
    bestRate: attempts.length ? scoreByKind.best / attempts.length : 0,
    weakRate: attempts.length ? scoreByKind.weak / attempts.length : 0,
    modulesCompleted,
    modulesInProgress,
    modulesTotal: db.modules.length,
    scoreByKind,
  };

  return {
    ...partial,
    level: levelFromXp(totalXp),
    badges: badgesFor(partial),
  };
}

export async function getEmployeeStats(employeeId: string): Promise<EmployeeStats | null> {
  const db = await readDB();
  const employee = db.employees.find((e) => e.id === employeeId);
  if (!employee) return null;
  return buildEmployeeStats(db, employee);
}

export async function getSalonStats(salonId: string): Promise<SalonStats | null> {
  const db = await readDB();
  const salon = db.salons.find((s) => s.id === salonId);
  if (!salon) return null;
  const employees = db.employees
    .filter((e) => e.salonIds.includes(salonId))
    .map((e) => buildEmployeeStats(db, e));

  const totalXp = employees.reduce((sum, e) => sum + e.totalXp, 0);
  const totalAttempts = employees.reduce((sum, e) => sum + e.attemptsCount, 0);
  const totalBest = employees.reduce((sum, e) => sum + e.scoreByKind.best, 0);
  const possibleModules = employees.length * db.modules.length;
  const completedModules = employees.reduce((sum, e) => sum + e.modulesCompleted, 0);

  return {
    salon,
    employees: employees.sort((a, b) => b.totalXp - a.totalXp),
    totalXp,
    avgXp: employees.length ? Math.round(totalXp / employees.length) : 0,
    topEmployee: employees.reduce<EmployeeStats | null>((acc, e) => (acc && acc.totalXp >= e.totalXp ? acc : e), null),
    totalAttempts,
    avgBestRate: totalAttempts ? totalBest / totalAttempts : 0,
    modulesCompletionRate: possibleModules ? completedModules / possibleModules : 0,
  };
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const db = await readDB();
  const employeeStats = db.employees.map((e) => buildEmployeeStats(db, e));
  const salonStats: SalonStats[] = [];
  for (const s of db.salons) {
    const stats = await getSalonStats(s.id);
    if (stats) salonStats.push(stats);
  }

  const totals = {
    employees: db.employees.length,
    salons: db.salons.length,
    attempts: db.attempts.length,
    bestAnswers: db.attempts.filter((a) => a.kind === "best").length,
    completedModules: db.progress.filter((p) => p.status === "completed").length,
    approvedSales: db.saleProofs.filter((p) => p.status === "approved").length,
    completedMissions: db.rewardEvents.filter((event) => event.kind === "mission_bonus").length,
  };

  return {
    totals,
    topEmployees: [...employeeStats].sort((a, b) => b.totalXp - a.totalXp).slice(0, 8),
    topSalons: [...salonStats].sort((a, b) => b.avgXp - a.avgXp),
  };
}

export function levelTitle(level: number): string {
  return (
    [
      "Новичок",
      "Стажёр",
      "Уверенный продавец",
      "Опытный продавец",
      "Наставник",
      "Эксперт",
      "Чемпион салона",
    ][level] ?? "Новичок"
  );
}

export function levelProgress(xp: number): { current: number; nextAt: number; pct: number; level: number } {
  const thresholds = [0, 1, 70, 150, 250, 400, 600, 900];
  const level = levelFromXp(xp);
  const lower = thresholds[level] ?? 0;
  const upper = thresholds[level + 1] ?? lower + 300;
  const pct = Math.min(1, Math.max(0, (xp - lower) / Math.max(1, upper - lower)));
  return { current: xp, nextAt: upper, pct, level };
}
