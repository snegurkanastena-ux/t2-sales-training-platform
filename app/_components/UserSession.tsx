"use client";

import Link from "next/link";
import { useTransition } from "react";
import { logoutEmployeeAction } from "@/app/actions";
import type { Employee, Salon } from "@/lib/types";
import { Avatar } from "./Avatar";

interface Props {
  employee: Employee | null;
  salon: Salon | null;
}

export function UserSession({ employee, salon }: Props) {
  const [pending, start] = useTransition();

  if (!employee) {
    return (
      <Link href="/login" className="btn btn-primary btn-sm">
        Войти
      </Link>
    );
  }

  return (
    <div className="user-session">
      <Avatar name={employee.fullName} hue={employee.avatarHue} size="sm" />
      <div className="user-session-meta">
        <span className="name" title={employee.fullName}>
          {employee.fullName}
          {employee.isManual && <span className="user-session-manual" title="Введён вручную">·</span>}
        </span>
        <span className="meta">{salon?.name ?? "—"}</span>
      </div>
      <button
        type="button"
        className="btn btn-ghost btn-sm user-session-logout"
        disabled={pending}
        onClick={() => start(() => logoutEmployeeAction())}
        aria-label="Выйти"
      >
        {pending ? "..." : "Выйти"}
      </button>
    </div>
  );
}
