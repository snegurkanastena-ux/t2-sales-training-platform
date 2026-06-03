"use client";

import { useState } from "react";

interface Props {
  buttonClassName?: string;
  label?: string;
  href?: string;
}

export function PilotCTA({
  buttonClassName = "",
  label = "Запустить пилот",
  href = "/login",
}: Props) {
  const [shown, setShown] = useState(false);
  const cls = ["btn", "btn-primary", buttonClassName].filter(Boolean).join(" ");

  return (
    <>
      <button
        type="button"
        className={cls}
        onClick={() => {
          setShown(true);
          window.setTimeout(() => {
            window.location.href = href;
          }, 650);
        }}
      >
        {label}
      </button>
      {shown && (
        <div className="toast" role="status">
          Запускаю пилот: выберите ТТ и продавца для демо-маршрута
        </div>
      )}
    </>
  );
}
