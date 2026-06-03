import "server-only";
import { cookies } from "next/headers";
import { readDB } from "./db";
import type { Employee, Salon } from "./types";

const COOKIE_NAME = "t2_current_employee";
const SALON_COOKIE_NAME = "t2_current_salon";
const ADMIN_COOKIE_NAME = "t2_admin_auth";
const ONE_YEAR = 60 * 60 * 24 * 365;

export interface CurrentSession {
  employee: Employee;
  salon: Salon | null;
}

/**
 * Возвращает текущего сотрудника по cookie или `null`, если он не вошёл.
 * Никаких fallback-ов на случайного сотрудника — экран входа отвечает за выбор.
 */
export async function getCurrentEmployee(): Promise<Employee | null> {
  const store = await cookies();
  const id = store.get(COOKIE_NAME)?.value;
  if (!id) return null;
  const db = await readDB();
  return db.employees.find((e) => e.id === id) ?? null;
}

export async function getCurrentSession(): Promise<CurrentSession | null> {
  const employee = await getCurrentEmployee();
  if (!employee) return null;
  const db = await readDB();
  const store = await cookies();
  const selectedSalonId = store.get(SALON_COOKIE_NAME)?.value;
  const validSalonId =
    selectedSalonId && employee.salonIds.includes(selectedSalonId)
      ? selectedSalonId
      : employee.salonIds[0] ?? employee.salonId;
  const salon = db.salons.find((s) => s.id === validSalonId) ?? null;
  return { employee, salon };
}

export async function setCurrentEmployee(id: string, selectedSalonId?: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, id, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR,
  });
  if (selectedSalonId) {
    store.set(SALON_COOKIE_NAME, selectedSalonId, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: ONE_YEAR,
    });
  }
}

export async function clearCurrentEmployee(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
  store.delete(SALON_COOKIE_NAME);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return store.get(ADMIN_COOKIE_NAME)?.value === "true";
}

export async function setAdminAuthenticated(value: boolean): Promise<void> {
  const store = await cookies();
  if (!value) {
    store.delete(ADMIN_COOKIE_NAME);
    return;
  }
  store.set(ADMIN_COOKIE_NAME, "true", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR,
  });
}

export async function clearAdminAuthenticated(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE_NAME);
}
