import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/haulr/AppShell";
import { formatMoney } from "@/lib/pricing";

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

function MoverPage() {
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["available-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("status", "SEARCHING")
        .order("created_at", { ascending: false })
        .limit(25);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Available hauls</h1>
        <p className="mt-1 text-sm text-muted-foreground">Jobs waiting for a mover right now.</p>

        <div className="mt-6 space-y-3">
          {isLoading && <p className="text-sm text-muted-foreground">Loading jobs…</p>}
          {!isLoading && jobs.length === 0 && (
            <div className="surface-card p-8 text-center text-sm text-muted-foreground">
              No open jobs at the moment. Check back soon.
            </div>
          )}
          {jobs.map((job) => (
            <Link
              key={job.id}
              to="/jobs/$jobId"
              params={{ jobId: job.id }}
              className="surface-card block p-5 transition-colors hover:border-accent"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{job.pickup_address}</p>
                  <p className="text-sm text-muted-foreground">to {job.dropoff_address}</p>
                </div>
                <span className="text-base font-bold">
                  {formatMoney(Number(job.mover_payout ?? 0))}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
