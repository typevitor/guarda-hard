"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type MenuItem = {
  href: string;
  label: string;
};

const MENU_ITEMS: MenuItem[] = [
  { href: "/", label: "Dashboard" },
  { href: "/departamentos", label: "Departamentos" },
  { href: "/usuarios", label: "Usuarios" },
  { href: "/hardwares", label: "Hardwares" },
  { href: "/emprestimo", label: "Emprestimo" },
  { href: "/devolucao", label: "Devolucao" },
  { href: "/relatorios", label: "Relatorios" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarMenu({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname() ?? "/";

  return (
    <nav aria-label="Menu principal" className={compact ? "menu menu-compact" : "menu"}>
      {MENU_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={active ? "menu-link is-active" : "menu-link"}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
