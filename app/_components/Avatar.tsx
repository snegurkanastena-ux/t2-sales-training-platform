import type { CSSProperties } from "react";

interface AvatarProps {
  name: string;
  hue: number;
  size?: "sm" | "md" | "lg";
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({ name, hue, size = "md" }: AvatarProps) {
  const cls = ["avatar", size === "lg" ? "avatar-lg" : size === "sm" ? "avatar-sm" : ""]
    .filter(Boolean)
    .join(" ");
  const style = { ["--avatar-hue" as string]: String(hue) } as CSSProperties;
  return (
    <span className={cls} style={style} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
