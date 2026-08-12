import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/haulr/AppShell";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/pricing";

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

function DashboardPage() {
  const { user } = useAuth();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["my-jobs", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("customer_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold sm:text-3xl">Your moves</h1>
          <Button asChild className="rounded-xl">
            <Link to="/book">
              <Plus className="mr-1 h-4 w-4" />
              New move
            </Link>
          </Button>
        </div>

        <div className="mt-6 space-y-3">
          {isLoading && <p className="text-sm text-muted-foreground">Loading your moves…</p>}
          {!isLoading && jobs.length === 0 && (
            <div className="surface-card p-8 text-center">
              <p className="font-semibold">No moves yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Book your first haul and it will show up here.
              </p>
              <Button asChild className="mt-4 rounded-xl">
                <Link to="/book">Get an estimate</Link>
              </Button>
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
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                  {String(job.status).replaceAll("_", " ").toLowerCase()}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold">
                {formatMoney(Number(job.customer_price ?? 0))}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
