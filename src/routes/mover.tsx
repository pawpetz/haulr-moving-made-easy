import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Loader2, MapPin, Star } from "lucide-react";
import { AppShell } from "@/components/haulr/AppShell";
import { StatusPill } from "@/components/haulr/StatusTracker";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { fetchMoverByUser, setMoverOnline } from "@/services/movers.service";
import { acceptJob, fetchMoverJobs, fetchOpenJobs } from "@/services/jobs.service";
import { formatMoney } from "@/lib/pricing";
import type { JobStatus } from "@/lib/types";

export const Route = createFileRoute("/mover")({
  head: () => ({
    meta: [
      { title: "Mover portal — Haulr" },
      { name: "description", content: "Browse nearby hauls, accept jobs and track your earnings." },
      { property: "og:title", content: "Mover portal — Haulr" },
      { property: "og:description", content: "Find hauls near you and get paid fast." },
    ],
  }),
  component: MoverPage,
});

const OPEN_STATUSES: JobStatus[] = [
  "MOVER_ASSIGNED",
  "MOVER_EN_ROUTE",
  "MOVER_ARRIVED",
  "LOADING",
  "IN_TRANSIT",
  "UNLOADING",
];

function MoverPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [accepting, setAccepting] = useState<string | null>(null);

  const { data: mover, isLoading: moverLoading } = useQuery({
    queryKey: ["mover-profile", user?.id],
    enabled: Boolean(user?.id),
    queryFn: () => fetchMoverByUser(user!.id),
  });

  const { data: myJobs = [] } = useQuery({
    queryKey: ["mover-jobs", user?.id],
    enabled: Boolean(user?.id),
    queryFn: () => fetchMoverJobs(user!.id),
  });

  const { data: openJobs = [], isLoading: openLoading } = useQuery({
    queryKey: ["open-jobs"],
    enabled: Boolean(mover?.is_online),
    queryFn: fetchOpenJobs,
    refetchInterval: 15000,
  });

  const currentJob = myJobs.find((job) => OPEN_STATUSES.includes(job.status as JobStatus));

  const toggleOnline = async (next: boolean) => {
    if (!mover) return;
    await setMoverOnline(mover.id, next);
    void queryClient.invalidateQueries({ queryKey: ["mover-profile", user?.id] });
  };

  const handleAccept = async (jobId: string) => {
    if (!mover || !user) return;
    setAccepting(jobId);
    try {
      await acceptJob(jobId, mover.id, user.id);
      toast.success("Job accepted");
      void queryClient.invalidateQueries({ queryKey: ["mover-jobs", user.id] });
      void queryClient.invalidateQueries({ queryKey: ["open-jobs"] });
      void navigate({ to: "/jobs/$jobId", params: { jobId } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not accept job");
    } finally {
      setAccepting(null);
    }
  };

  if (moverLoading) {
    return (
      <AppShell>
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (!mover) {
    return (
      <AppShell>
        <div className="surface-card mx-auto max-w-md p-8 text-center">
          <p className="font-semibold">You haven't applied to drive yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Submit your mover application to start accepting hauls.
          </p>
          <Button asChild className="mt-4 rounded-xl">
            <Link to="/mover-apply">Apply to drive</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  if (mover.status !== "APPROVED") {
    return (
      <AppShell>
        <div className="surface-card mx-auto max-w-md p-8 text-center">
          <p className="font-semibold">
            Application {mover.status.toLowerCase().replaceAll("_", " ")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {mover.status === "REJECTED"
              ? "Your application wasn't approved this time."
              : "We're reviewing your details — this usually takes 1–2 business days."}
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Dark stat card — deliberately distinct from the customer dashboard's light cards */}
        <div className="rounded-2xl bg-ink p-5 text-ink-foreground shadow-soft sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={
                  "h-2 w-2 rounded-full " +
                  (mover.is_online ? "bg-success" : "bg-ink-foreground/30")
                }
              />
              <span className="text-sm font-semibold">
                {mover.is_online ? "Online — visible to nearby jobs" : "Offline"}
              </span>
            </div>
            <Switch checked={mover.is_online} onCheckedChange={(v) => void toggleOnline(v)} />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-ink-foreground/60">Earnings</p>
              <p className="mt-1 truncate font-mono text-base font-bold sm:text-xl">
                {formatMoney(Number(mover.total_earnings ?? 0))}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-ink-foreground/60">Completed</p>
              <p className="mt-1 truncate font-mono text-base font-bold sm:text-xl">
                {mover.jobs_completed}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-ink-foreground/60">Rating</p>
              <p className="mt-1 flex items-center gap-1 truncate font-mono text-base font-bold sm:text-xl">
                <Star className="h-4 w-4 shrink-0 fill-accent text-accent" />
                {Number(mover.rating ?? 5).toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        {currentJob ? (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Current job
            </h2>
            <Link
              to="/jobs/$jobId"
              params={{ jobId: currentJob.id }}
              className="surface-card block space-y-3 p-5 transition-colors hover:border-accent"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{currentJob.pickup_address}</p>
                  <p className="text-sm text-muted-foreground">to {currentJob.dropoff_address}</p>
                </div>
                <StatusPill status={currentJob.status as JobStatus} />
              </div>
              {currentJob.customer_name && (
                <p className="text-sm text-muted-foreground">
                  Customer:{" "}
                  <span className="font-medium text-foreground">{currentJob.customer_name}</span>
                </p>
              )}
              <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                <span className="font-semibold">
                  {formatMoney(Number(currentJob.mover_payout ?? 0))} payout
                </span>
                <span className="flex items-center gap-1 font-medium text-accent-foreground">
                  Manage job <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          </section>
        ) : (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Available hauls
              </h2>
              {mover.is_online && (
                <span className="text-xs text-muted-foreground">Refreshes automatically</span>
              )}
            </div>

            {!mover.is_online && (
              <div className="surface-card p-8 text-center text-sm text-muted-foreground">
                You're offline. Flip the switch above to start seeing nearby jobs.
              </div>
            )}

            {mover.is_online && openLoading && <div className="surface-card h-24 animate-pulse" />}

            {mover.is_online && !openLoading && openJobs.length === 0 && (
              <div className="surface-card p-8 text-center text-sm text-muted-foreground">
                No open jobs right now. Check back soon.
              </div>
            )}

            {mover.is_online &&
              openJobs.map((job) => (
                <div key={job.id} className="surface-card space-y-3 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <div>
                        <p className="font-semibold">{job.pickup_address}</p>
                        <p className="text-sm text-muted-foreground">to {job.dropoff_address}</p>
                      </div>
                    </div>
                    <span className="shrink-0 text-lg font-bold text-success">
                      {formatMoney(Number(job.mover_payout ?? 0))}
                    </span>
                  </div>

                  {job.items && job.items.length > 0 && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Items: </span>
                      {job.items
                        .map((i) =>
                          i.quantity > 1 ? `${i.quantity}x ${i.item_type}` : i.item_type,
                        )
                        .join(", ")}
                    </p>
                  )}

                  {job.special_instructions && (
                    <p className="rounded-lg bg-secondary/60 px-3 py-2 text-sm text-muted-foreground">
                      "{job.special_instructions}"
                    </p>
                  )}

                  {job.photos && job.photos.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {job.photos.map((photo) => (
                        <img
                          key={photo.id}
                          src={photo.url ?? undefined}
                          alt="Item reference"
                          className="h-16 w-16 shrink-0 rounded-lg object-cover"
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <span className="text-xs text-muted-foreground">
                      {String(job.vehicle_type ?? "").replaceAll("_", " ")} ·{" "}
                      {Number(job.distance_miles ?? 0).toFixed(1)} mi
                    </span>
                    <Button
                      size="sm"
                      className="rounded-xl"
                      disabled={accepting === job.id}
                      onClick={() => void handleAccept(job.id)}
                    >
                      {accepting === job.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Accept job"
                      )}
                    </Button>
                  </div>
                </div>
              ))}
          </section>
        )}
      </div>
    </AppShell>
  );
}
