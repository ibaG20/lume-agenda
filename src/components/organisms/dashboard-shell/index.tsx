"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppIcon } from "@/components/atoms/app-icon";
import { AppLink } from "@/components/atoms/app-link";
import { BrandLogo } from "@/components/atoms/brand-logo";
import styles from "./index.module.css";

const navigation = [
  { href: "/inicio", label: "Início", icon: "home" as const, exact: true },
  {
    href: "/inicio/agendamentos",
    label: "Agendamentos",
    icon: "calendar" as const,
  },
  { href: "/inicio/horarios", label: "Horários", icon: "clock" as const },
  { href: "/perfil", label: "Perfil", icon: "profile" as const },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-svh bg-base-200 text-base-content">
      <aside className={styles.sidebar} aria-label="Navegação principal">
        <AppLink className={styles.brand} href="/inicio">
          <BrandLogo tone="dark" />
        </AppLink>
        <nav className="flex flex-col gap-2">
          {navigation.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <AppLink
                aria-current={active ? "page" : undefined}
                className={styles.navLink}
                data-active={active}
                href={item.href}
                key={item.href}
              >
                <AppIcon name={item.icon} />
                <span>{item.label}</span>
              </AppLink>
            );
          })}
        </nav>
        <p className={styles.sidebarHint}>Sua agenda, simples e organizada.</p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className={styles.mobileHeader}>
          <AppLink className={styles.brand} href="/inicio">
            <BrandLogo />
          </AppLink>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-36 pt-6 sm:px-6 lg:px-10 lg:pb-10 lg:pt-10">
          {children}
        </main>
        <nav className={styles.dock} aria-label="Navegação principal">
          {navigation.slice(0, 2).map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <AppLink
                aria-current={active ? "page" : undefined}
                className={styles.dockLink}
                data-active={active}
                href={item.href}
                key={item.href}
              >
                <AppIcon name={item.icon} size={21} />
                <span>{item.label}</span>
              </AppLink>
            );
          })}
          <AppLink
            aria-label="Novo horário"
            className={styles.dockAction}
            href="/inicio/horarios/criar"
          >
            <AppIcon name="plus" size={24} />
          </AppLink>
          {navigation.slice(2).map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <AppLink
                aria-current={active ? "page" : undefined}
                className={styles.dockLink}
                data-active={active}
                href={item.href}
                key={item.href}
              >
                <AppIcon name={item.icon} size={21} />
                <span>{item.label}</span>
              </AppLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
