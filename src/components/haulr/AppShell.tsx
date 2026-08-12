import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  ClipboardList,
  Home,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Truck,
  User,
} from "lucide-react";
import { Logo } from "./Logo";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
}

const CUSTOMER_NAV: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/book", label: "Book", icon: Package },
  { to: "/account", label: "Account", icon: User },
];

const MOVER_NAV: NavItem[] = [
  { to: "/mover", label: "Home", icon: Truck },
  { to: "/dashboard", label: "My moves", icon: ClipboardList },
  { to: "/account", label: "Profile", icon: User },
];

const ADMIN_NAV: NavItem[] = [
  { to: "/admin", label: "Admin", icon: LayoutDashboard },
  { to: "/dashboard", label: "Jobs", icon: ClipboardList },
  { to: "/account", label: "Account", icon: Settings },
];

export function AppShell({
  children,
  title,
  subtitle,
  action,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  const { primaryRole, signOut, profile } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const nav = primaryRole === "admin" ? ADMIN_NAV : primaryRole === "mover" ? MOVER_NAV : CUSTOMER_NAV;

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  pathname === item.to
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
            {primaryRole === "customer" && (
              <Link
                to="/mover-apply"
                className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Drive with Haulr
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {profile?.full_name || "Account"}
            </span>
            <Button variant="ghost" size="icon" aria-label="Sign out" onClick={() => void signOut()}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {(title || action) && (
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              {title && <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>}
              {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            {action}
          </div>
        )}
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card md:hidden">
        <div className="flex">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-medium",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "text-accent")} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
