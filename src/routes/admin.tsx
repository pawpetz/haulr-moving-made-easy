import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/haulr/AppShell";
import { formatMoney } from "@/lib/pricing";

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

function AdminPage() {
  const { data } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [jobs, movers] = await Promise.all([
        supabase.from("jobs").select("id, status, total_amount, platform_fee"),
        supabase.from("mover_profiles").select("id, approval_status"),
      ]);
      if (jobs.error) throw jobs.error;
      if (movers.error) throw movers.error;
      return { jobs: jobs.data ?? [], movers: movers.data ?? [] };
    },
  });

  const jobs = data?.jobs ?? [];
  const movers = data?.movers ?? [];
  const revenue = jobs.reduce((sum, j) => sum + Number(j.platform_fee ?? 0), 0);
  const gmv = jobs.reduce((sum, j) => sum + Number(j.total_amount ?? 0), 0);
  const pending = movers.filter((m) => m.approval_status === "PENDING").length;

  const stats = [
    { label: "Total jobs", value: String(jobs.length) },
    { label: "Movers", value: String(movers.length) },
    { label: "Pending approvals", value: String(pending) },
    { label: "GMV", value: formatMoney(gmv) },
    { label: "Platform revenue", value: formatMoney(revenue) },
  ];

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-4xl px-4 py-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Platform overview</h1>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="surface-card p-5">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-2 text-2xl font-extrabold">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
