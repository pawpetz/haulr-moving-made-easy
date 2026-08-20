import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BarChart3,
  Check,
  DollarSign,
  ClipboardList,
  Loader2,
  LogOut,
  Pause,
  Users,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/haulr/Logo";
import { StatusPill } from "@/components/haulr/StatusTracker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setMoverStatus } from "@/services/movers.service";
import { updateJobStatus } from "@/services/jobs.service";
import { formatMoney } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { JobStatus, MoverStatus } from "@/lib/types";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Haulr" },
      { name: "description", content: "Platform oversight for jobs, movers and revenue." },
      { property: "og:title", content: "Admin — Haulr" },
      { property: "og:description", content: "Haulr platform oversight." },
    ],
  }),
  component: AdminPage,
});

const NAV = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "movers", label: "Movers", icon: Users },
  { key: "jobs", label: "Jobs", icon: ClipboardList },
  { key: "pricing", label: "Pricing", icon: DollarSign },
] as const;
type Tab = (typeof NAV)[number]["key"];

function AdminPage() {
  const { user, profile, primaryRole, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [actingOn, setActingOn] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      void navigate({ to: "/auth", search: { redirect: "/admin" } });
      return;
    }
    if (primaryRole !== "admin") {
      void navigate({ to: "/dashboard" });
    }
  }, [authLoading, user, primaryRole, navigate]);

  const { data } = useQuery({
    queryKey: ["admin-overview"],
    enabled: primaryRole === "admin",
    queryFn: async () => {
      const [jobs, movers] = await Promise.all([
        supabase
          .from("jobs")
          .select(
            "id, reference, customer_name, pickup_address, dropoff_address, status, customer_price, platform_fee, mover_payout, created_at, mover:mover_profiles(full_name, business_name)",
          )
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("mover_profiles")
          .select(
            "id, full_name, business_name, email, phone, service_area, status, rating, jobs_completed, total_earnings, created_at",
          )
          .order("created_at", { ascending: false }),
      ]);
      if (jobs.error) throw jobs.error;
      if (movers.error) throw movers.error;
      return { jobs: jobs.data ?? [], movers: movers.data ?? [] };
    },
  });

  const { data: pricingRules, isLoading: pricingLoading } = useQuery({
    queryKey: ["pricing-rules"],
    enabled: primaryRole === "admin",
    queryFn: async () => {
      const { data, error } = await supabase.from("pricing_rules").select("*").order("key");
      if (error) throw error;
      return data ?? [];
    },
  });

  const jobs = data?.jobs ?? [];
  const movers = data?.movers ?? [];
  const revenue = jobs.reduce((sum, j) => sum + Number(j.platform_fee ?? 0), 0);
  const gmv = jobs.reduce((sum, j) => sum + Number(j.customer_price ?? 0), 0);
  const pendingMovers = movers.filter((m) => m.status === "PENDING" || m.status === "UNDER_REVIEW");

  const stats = [
    { label: "Total jobs", value: String(jobs.length) },
    { label: "Movers", value: String(movers.length) },
    { label: "Pending approvals", value: String(pendingMovers.length) },
    { label: "GMV", value: formatMoney(gmv) },
    { label: "Platform revenue", value: formatMoney(revenue) },
  ];

  const changeMoverStatus = async (moverId: string, status: MoverStatus) => {
    setActingOn(moverId);
    try {
      await setMoverStatus(moverId, status);
      void queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
      toast.success(`Mover ${status.toLowerCase().replaceAll("_", " ")}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update mover");
    } finally {
      setActingOn(null);
    }
  };

  const cancelJob = async (jobId: string) => {
    setActingOn(jobId);
    try {
      await updateJobStatus(jobId, "CANCELLED", "Cancelled by admin");
      void queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
      toast.success("Job cancelled");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not cancel job");
    } finally {
      setActingOn(null);
    }
  };

  const [pricingEdits, setPricingEdits] = useState<Record<string, string>>({});
  const [savingPricing, setSavingPricing] = useState(false);

  const savePricing = async () => {
    if (Object.keys(pricingEdits).length === 0) return;
    setSavingPricing(true);
    try {
      await Promise.all(
        Object.entries(pricingEdits).map(([key, value]) =>
          supabase
            .from("pricing_rules")
            .update({ value: Number(value) })
            .eq("key", key)
            .then(({ error }) => {
              if (error) throw error;
            }),
        ),
      );
      setPricingEdits({});
      void queryClient.invalidateQueries({ queryKey: ["pricing-rules"] });
      toast.success("Pricing rules updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save pricing");
    } finally {
      setSavingPricing(false);
    }
  };

  if (authLoading || !user || primaryRole !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activeLabel = NAV.find((n) => n.key === tab)?.label ?? "Overview";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar — desktop only */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <div className="px-5 py-5">
          <Logo />
          <span className="mt-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Admin
          </span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = tab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {item.key === "movers" && pendingMovers.length > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-accent-foreground">
                    {pendingMovers.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <div className="flex items-center justify-between gap-2 rounded-xl px-2 py-2">
            <span className="truncate text-sm text-muted-foreground">
              {profile?.full_name || "Admin"}
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

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-border bg-card/90 px-4 py-4 backdrop-blur sm:px-6">
          <div className="flex items-center justify-between lg:hidden">
            <Logo />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sign out"
              onClick={() => void signOut()}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          <h1 className="mt-3 text-xl font-bold sm:text-2xl lg:mt-0">{activeLabel}</h1>
          {/* Mobile nav */}
          <div className="mt-3 flex gap-1 overflow-x-auto lg:hidden">
            {NAV.map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  tab === item.key
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6">
          {tab === "overview" && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="surface-card p-5">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-2xl font-extrabold">{stat.value}</p>
                </div>
              ))}
            </div>
          )}

          {tab === "movers" && (
            <div className="space-y-3">
              {movers.length === 0 && (
                <div className="surface-card p-8 text-center text-sm text-muted-foreground">
                  No mover applications yet.
                </div>
              )}
              {movers.map((mover) => (
                <div key={mover.id} className="surface-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{mover.business_name || mover.full_name}</p>
                      {mover.business_name && (
                        <p className="text-xs text-muted-foreground">{mover.full_name}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {mover.email} · {mover.service_area || "No service area set"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        ⭐ {Number(mover.rating ?? 5).toFixed(1)} · {mover.jobs_completed} jobs ·{" "}
                        {formatMoney(Number(mover.total_earnings ?? 0))} earned
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
                        mover.status === "APPROVED" && "bg-success/15 text-success",
                        (mover.status === "PENDING" || mover.status === "UNDER_REVIEW") &&
                          "bg-accent/20 text-accent-foreground",
                        (mover.status === "REJECTED" || mover.status === "SUSPENDED") &&
                          "bg-destructive/10 text-destructive",
                      )}
                    >
                      {mover.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2 border-t border-border pt-3">
                    {mover.status !== "APPROVED" && (
                      <Button
                        size="sm"
                        className="rounded-xl"
                        disabled={actingOn === mover.id}
                        onClick={() => void changeMoverStatus(mover.id, "APPROVED")}
                      >
                        <Check className="mr-1 h-3.5 w-3.5" /> Approve
                      </Button>
                    )}
                    {mover.status !== "REJECTED" && mover.status !== "APPROVED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        disabled={actingOn === mover.id}
                        onClick={() => void changeMoverStatus(mover.id, "REJECTED")}
                      >
                        <X className="mr-1 h-3.5 w-3.5" /> Reject
                      </Button>
                    )}
                    {mover.status === "APPROVED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl text-destructive hover:text-destructive"
                        disabled={actingOn === mover.id}
                        onClick={() => void changeMoverStatus(mover.id, "SUSPENDED")}
                      >
                        <Pause className="mr-1 h-3.5 w-3.5" /> Suspend
                      </Button>
                    )}
                    {mover.status === "SUSPENDED" && (
                      <Button
                        size="sm"
                        className="rounded-xl"
                        disabled={actingOn === mover.id}
                        onClick={() => void changeMoverStatus(mover.id, "APPROVED")}
                      >
                        Reinstate
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "jobs" && (
            <div className="surface-card overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="p-3">Customer</th>
                    <th className="p-3">Route</th>
                    <th className="p-3">Mover</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Price</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No jobs yet.
                      </td>
                    </tr>
                  )}
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-b border-border last:border-0">
                      <td className="p-3">{job.customer_name}</td>
                      <td className="max-w-[220px] p-3">
                        <p className="truncate">{job.pickup_address}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          to {job.dropoff_address}
                        </p>
                      </td>
                      <td className="p-3">
                        {job.mover ? job.mover.business_name || job.mover.full_name : "—"}
                      </td>
                      <td className="p-3">
                        <StatusPill status={job.status as JobStatus} />
                      </td>
                      <td className="p-3 text-right font-medium">
                        {formatMoney(Number(job.customer_price ?? 0))}
                      </td>
                      <td className="p-3 text-right">
                        {job.status !== "COMPLETED" && job.status !== "CANCELLED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl text-destructive hover:text-destructive"
                            disabled={actingOn === job.id}
                            onClick={() => void cancelJob(job.id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "pricing" && (
            <div className="surface-card max-w-lg space-y-4 p-5">
              {pricingLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
              {pricingRules?.map((rule) => (
                <div key={rule.key} className="space-y-1.5">
                  <Label>
                    {rule.label}{" "}
                    <span className="text-xs text-muted-foreground">({rule.unit})</span>
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={pricingEdits[rule.key] ?? String(rule.value)}
                    onChange={(e) =>
                      setPricingEdits((prev) => ({ ...prev, [rule.key]: e.target.value }))
                    }
                    className="h-11 rounded-xl"
                  />
                </div>
              ))}
              <Button
                className="w-full rounded-xl"
                disabled={savingPricing || Object.keys(pricingEdits).length === 0}
                onClick={() => void savePricing()}
              >
                {savingPricing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save pricing rules"
                )}
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
