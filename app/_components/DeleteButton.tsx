"use client";

import { useTransition } from "react";

interface Props {
  action: () => Promise<void>;
  confirm?: string;
  label?: string;
}

export function DeleteButton({ action, confirm, label }: Props) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="btn btn-danger btn-sm"
      disabled={pending}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        start(() => {
          void action();
        });
      }}
    >
      {pending ? "..." : label ?? "Удалить"}
    </button>
  );
}
