"use client";

import { useMemo, useState, useTransition } from "react";
import { loginAdminAction, loginEmployeeManualAction, loginEmployeeWithSalonAction } from "@/app/actions";
import type { Employee, Salon } from "@/lib/types";

interface Props {
  salons: Salon[];
  employees: Employee[];
  /** Предзаполнить выбранную ТТ. */
  initialSalonId?: string;
  /** Сразу открыть форму ручного ввода. */
  initialManual?: boolean;
}

export function LoginCard({ salons, employees, initialSalonId, initialManual = false }: Props) {
  const [salonId, setSalonId] = useState<string>(initialSalonId ?? salons[0]?.id ?? "");
  const filteredEmployees = useMemo(
    () =>
      employees
        .filter((e) => e.salonIds.includes(salonId))
        .sort((a, b) => a.fullName.localeCompare(b.fullName, "ru")),
    [employees, salonId]
  );
  const [employeeId, setEmployeeId] = useState<string>(filteredEmployees[0]?.id ?? "");
  const [manual, setManual] = useState(initialManual);
  const [fullName, setFullName] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminFullName, setAdminFullName] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState<string | null>(null);
  const [pendingAdmin, startAdmin] = useTransition();

  // Если ТТ изменилась — сбрасываем выбранного сотрудника
  const [prevSalonId, setPrevSalonId] = useState(salonId);
  if (prevSalonId !== salonId) {
    setPrevSalonId(salonId);
    setEmployeeId(filteredEmployees[0]?.id ?? "");
  }

  const selectedSalon = salons.find((s) => s.id === salonId);

  function handleSubmit() {
    setError(null);
    if (!salonId) {
      setError("Выберите торговую точку");
      return;
    }
    if (manual) {
      const trimmed = fullName.trim();
      if (trimmed.length < 3) {
        setError("Введите ФИО полностью");
        return;
      }
      start(() => loginEmployeeManualAction({ salonId, fullName: trimmed }));
    } else {
      if (!employeeId) {
        setError("Выберите сотрудника или введите ФИО вручную");
        return;
      }
      start(() => loginEmployeeWithSalonAction({ employeeId, salonId }));
    }
  }

  function handleAdminSubmit() {
    setAdminError(null);
    startAdmin(async () => {
      const result = await loginAdminAction({
        fullName: adminFullName,
        password: adminPassword,
      });
      if (!result.ok) {
        setAdminError(result.error);
      }
    });
  }

  return (
    <div className="login-card" role="region" aria-label="Вход сотрудника">
      <div className="login-card-head">
        <span className="hero-eyebrow">Вход в платформу</span>
        <h2>Выберите свою ТТ</h2>
        <p>Несколько секунд — и попадёте на свой профиль обучения. Без паролей.</p>
      </div>

      <div className="login-form stack">
        <div className="field">
          <label htmlFor="login-salon">Торговая точка</label>
          <select
            id="login-salon"
            value={salonId}
            onChange={(e) => setSalonId(e.target.value)}
            disabled={pending}
          >
            {salons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {selectedSalon && (
            <span className="field-hint">
              {selectedSalon.city} · {selectedSalon.address}
            </span>
          )}
        </div>

        {!manual ? (
          <div className="field">
            <label htmlFor="login-employee">Сотрудник</label>
            <select
              id="login-employee"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              disabled={pending || filteredEmployees.length === 0}
            >
              {filteredEmployees.length === 0 && <option value="">— нет сотрудников —</option>}
              {filteredEmployees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullName}
                  {e.isManual ? " · добавлен вручную" : ""}
                </option>
              ))}
            </select>
            <span className="field-hint">
              {filteredEmployees.length} {filteredEmployees.length === 1 ? "сотрудник" : "сотрудников"} в этой ТТ
            </span>
          </div>
        ) : (
          <div className="field">
            <label htmlFor="login-fullname">Введите ФИО</label>
            <input
              id="login-fullname"
              type="text"
              autoFocus
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Иванов Иван Иванович"
              disabled={pending}
            />
            <span className="field-hint">
              Будет создан новый сотрудник с пометкой «добавлен вручную» в выбранной ТТ.
            </span>
          </div>
        )}

        {error && (
          <div className="login-error" role="alert">
            {error}
          </div>
        )}

        <div className="login-actions">
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={handleSubmit}
            disabled={pending}
          >
            {pending ? "..." : manual ? "Войти вручную" : "Войти и начать обучение"}
          </button>
          <button
            type="button"
            className="login-link"
            onClick={() => setManual((m) => !m)}
            disabled={pending}
          >
            {manual ? "← Назад к списку сотрудников" : "Меня нет в списке — ввести ФИО вручную"}
          </button>
          <button
            type="button"
            className="login-link"
            onClick={() => {
              setAdminOpen((v) => !v);
              setAdminError(null);
            }}
            disabled={pendingAdmin}
          >
            {adminOpen ? "Скрыть вход администратора" : "Вход для администратора"}
          </button>
        </div>
      </div>

      {adminOpen && (
        <div className="stack" style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--border)" }}>
          <h3 style={{ margin: 0, fontSize: "1.05rem" }}>Вход для администратора</h3>
          <div className="field">
            <label htmlFor="admin-fullname">ФИО администратора</label>
            <input
              id="admin-fullname"
              type="text"
              value={adminFullName}
              onChange={(e) => setAdminFullName(e.target.value)}
              placeholder="Анастасия Мельникова"
              disabled={pendingAdmin}
            />
          </div>
          <div className="field">
            <label htmlFor="admin-password">Пароль</label>
            <input
              id="admin-password"
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Введите пароль"
              disabled={pendingAdmin}
            />
          </div>
          {adminError && (
            <div className="login-error" role="alert">
              {adminError}
            </div>
          )}
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={handleAdminSubmit}
            disabled={pendingAdmin}
          >
            {pendingAdmin ? "..." : "Войти в админ-панель"}
          </button>
        </div>
      )}
    </div>
  );
}
