"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface Props {
  href: string;
  exact?: boolean;
  children: ReactNode;
}

export function NavLink({ href, exact, children }: Props) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link href={href} className={`nav-link${active ? " active" : ""}`}>
      {children}
    </Link>
  );
}
