import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Package, Plus, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/haulr/AppShell";
import { StatusTracker, StatusPill } from "@/components/haulr/StatusTracker";
import { MapPlaceholder } from "@/components/haulr/MapPlaceholder";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/pricing";
import type { JobStatus } from "@/lib/types";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Your moves — Haulr" },
      { name: "description", content: "Track your active, upcoming and past Haulr moves." },
      { property: "og:title", content: "Your moves — Haulr" },
      { property: "og:description", content: "Track your Haulr moves in one place." },
    ],
  }),
  component: DashboardPage,
});

const OPEN_STATUSES: JobStatus[] = [
  "REQUESTED",
  "SEARCHING",
  "MOVER_ASSIGNED",
  "MOVER_EN_ROUTE",
  "MOVER_ARRIVED",
  "LOADING",
  "IN_TRANSIT",
  "UNLOADING",
];

function DashboardPage() {
  const { user, profile } = useAuth();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["my-jobs", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*, mover:mover_profiles(id, full_name, business_name, rating)")
        .eq("customer_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const activeJobs = jobs.filter((job) => OPEN_STATUSES.includes(job.status as JobStatus));
  const pastJobs = jobs.filter((job) => !OPEN_STATUSES.includes(job.status as JobStatus));
  const completedCount = jobs.filter((job) => job.status === "COMPLETED").length;
  const totalSpent = jobs
    .filter((job) => job.status === "COMPLETED")
    .reduce((sum, job) => sum + Number(job.customer_price ?? 0), 0);

  const firstName = profile?.full_name?.split(" ")[0];

  return (
    <AppShell
      title={firstName ? `Hey ${firstName}` : "Your moves"}
      subtitle={
        jobs.length > 0
          ? `${completedCount} move${completedCount === 1 ? "" : "s"} completed · ${formatMoney(totalSpent)} total`
          : "Book your first move to get started"
      }
      action={
        <Button asChild className="rounded-xl">
          <Link to="/book" search={{ pickup: "", dropoff: "", item: "", when: "" }}>
            <Plus className="mr-1.5 h-4 w-4" />
            New move
          </Link>
        </Button>
      }
    >
      {isLoading && (
        <div className="space-y-3">
          <div className="surface-card h-40 animate-pulse" />
          <div className="surface-card h-20 animate-pulse" />
        </div>
      )}

      {!isLoading && jobs.length === 0 && (
        <div className="surface-card flex flex-col items-center gap-3 p-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">No moves yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Book your first haul and it'll show up here with live tracking.
            </p>
          </div>
          <Button asChild className="mt-2 rounded-xl">
            <Link to="/book" search={{ pickup: "", dropoff: "", item: "", when: "" }}>
              Get an estimate
            </Link>
          </Button>
        </div>
      )}

      {!isLoading && jobs.length > 0 && (
        <div className="space-y-8">
          {activeJobs.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Active
              </h2>
              {activeJobs.map((job) => (
                <Link
                  key={job.id}
                  to="/jobs/$jobId"
                  params={{ jobId: job.id }}
                  className="surface-card block space-y-4 p-5 transition-colors hover:border-accent"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{job.pickup_address}</p>
                      <p className="text-sm text-muted-foreground">to {job.dropoff_address}</p>
                    </div>
                    <StatusPill status={job.status as JobStatus} />
                  </div>
                  <MapPlaceholder pickup={job.pickup_address} dropoff={job.dropoff_address} />
                  <StatusTracker status={job.status as JobStatus} />
                  {job.mover && (
                    <div className="flex items-center gap-2.5 rounded-xl bg-secondary/60 px-3 py-2.5">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-card text-xs font-semibold">
                          {initials(job.mover.business_name || job.mover.full_name || "Mover")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {job.mover.business_name || job.mover.full_name}
                        </p>
                      </div>
                      <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                        <Star className="h-3 w-3 fill-accent text-accent" />
                        {Number(job.mover.rating ?? 5).toFixed(1)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                    <span className="font-semibold">
                      {formatMoney(Number(job.customer_price ?? 0))}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-accent-foreground">
                      Track move <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </section>
          )}

          {pastJobs.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                History
              </h2>
              <div className="space-y-2">
                {pastJobs.map((job) => (
                  <Link
                    key={job.id}
                    to="/jobs/$jobId"
                    params={{ jobId: job.id }}
                    className="surface-card flex items-center justify-between gap-4 p-4 transition-colors hover:border-accent"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{job.pickup_address}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        to {job.dropoff_address}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-semibold">
                        {formatMoney(Number(job.customer_price ?? 0))}
                      </span>
                      <StatusPill status={job.status as JobStatus} />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </AppShell>
  );
}
