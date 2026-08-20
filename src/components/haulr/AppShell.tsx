import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
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
import { useAuth, type AppRole } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const ROLE_HOME: Record<AppRole, string> = {
  customer: "/dashboard",
  mover: "/mover",
  admin: "/admin",
};

const ROLE_LABEL: Record<AppRole, string> = {
  customer: "Customer",
  mover: "Mover",
  admin: "Admin",
};

function RoleSwitcher({ compact = false }: { compact?: boolean }) {
  const { roles, activeRole, setActiveRole } = useAuth();
  const navigate = useNavigate();
  if (roles.length <= 1) return null;

  return (
    <Select
      value={activeRole}
      onValueChange={(role) => {
        setActiveRole(role as AppRole);
        void navigate({ to: ROLE_HOME[role as AppRole] });
      }}
    >
      <SelectTrigger
        className={cn(
          "h-8 gap-1.5 rounded-full border-none bg-secondary px-3 text-xs font-semibold",
          compact ? "w-full justify-center" : "w-auto",
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align={compact ? "center" : "end"}>
        {roles.map((role) => (
          <SelectItem key={role} value={role}>
            View as {ROLE_LABEL[role]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

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
  const { activeRole, signOut, profile } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const nav =
    activeRole === "admin" ? ADMIN_NAV : activeRole === "mover" ? MOVER_NAV : CUSTOMER_NAV;
  const extraLink =
    activeRole === "customer" ? { to: "/mover-apply", label: "Drive with Haulr" } : null;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar — desktop only, matches the admin layout */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <div className="px-5 py-5">
          <Logo />
          <span className="mt-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {ROLE_LABEL[activeRole]}
          </span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          {extraLink && (
            <Link
              to={extraLink.to}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
            >
              <Truck className="h-4 w-4" />
              {extraLink.label}
            </Link>
          )}
        </nav>
        <div className="space-y-2 border-t border-border p-3">
          <RoleSwitcher compact />
          <div className="flex items-center justify-between gap-2 rounded-xl px-2 py-2">
            <span className="truncate text-sm text-muted-foreground">
              {profile?.full_name || "Account"}
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sign out"
              onClick={() => void signOut()}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
        {/* Top bar — mobile only */}
        <header className="sticky top-0 z-30 border-b border-border bg-card/90 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <Logo />
            <div className="flex items-center gap-2">
              <RoleSwitcher />
              <Button
                variant="ghost"
                size="icon"
                aria-label="Sign out"
                onClick={() => void signOut()}
              >
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

        {/* Bottom tab bar — mobile only */}
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card lg:hidden">
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
    </div>
  );
}
