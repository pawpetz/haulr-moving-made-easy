import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/haulr/AppShell";
import { StatusTracker } from "@/components/haulr/StatusTracker";
import { MapPlaceholder } from "@/components/haulr/MapPlaceholder";
import { PhotoUploader } from "@/components/haulr/PhotoUploader";
import { Button } from "@/components/ui/button";
import { updateJobStatus } from "@/services/jobs.service";
import { formatMoney } from "@/lib/pricing";
import { MOVER_ACTIONS } from "@/lib/constants";
import type { JobStatus } from "@/lib/types";

export const Route = createFileRoute("/jobs/$jobId")({
  head: () => ({
    meta: [
      { title: "Track your haul — Haulr" },
      { name: "description", content: "Live status, route and pricing for your Haulr job." },
      { property: "og:title", content: "Track your haul — Haulr" },
      { property: "og:description", content: "Live status and pricing for your Haulr job." },
    ],
  }),
  component: JobDetailPage,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-8 text-center text-sm text-muted-foreground">
      {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="p-8 text-center text-sm text-muted-foreground">Job not found.</div>
  ),
});

function JobDetailPage() {
  const { jobId } = Route.useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [advancing, setAdvancing] = useState(false);
  const [deliveryPhotos, setDeliveryPhotos] = useState<string[]>([]);

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", jobId],
    queryFn: async () => {
      const { data, error } = await supabase.from("jobs").select("*").eq("id", jobId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const isAssignedMover = Boolean(user && job && job.mover_user_id === user.id);
  const nextAction = job ? MOVER_ACTIONS.find((a) => a.from === job.status) : undefined;
  const isCompletionStep = nextAction?.to === "COMPLETED";

  const handleAdvance = async () => {
    if (!job || !nextAction) return;
    if (isCompletionStep && deliveryPhotos.length === 0) {
      toast.error("Add at least one delivery photo before completing the job");
      return;
    }
    setAdvancing(true);
    try {
      if (isCompletionStep) {
        await Promise.all(
          deliveryPhotos.map((url) =>
            supabase.from("job_photos").insert({ job_id: job.id, url, phase: "DELIVERY" }),
          ),
        );
      }
      await updateJobStatus(job.id, nextAction.to);
      void queryClient.invalidateQueries({ queryKey: ["job", jobId] });
      void queryClient.invalidateQueries({ queryKey: ["mover-jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["my-jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["mover-profile"] });
      toast.success(
        nextAction.to === "COMPLETED"
          ? "Job marked complete"
          : `Status updated: ${nextAction.label}`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update status");
    } finally {
      setAdvancing(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        {isLoading && <p className="text-sm text-muted-foreground">Loading job…</p>}
        {!isLoading && !job && (
          <p className="text-sm text-muted-foreground">We couldn't find that job.</p>
        )}
        {job && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">{job.pickup_address}</h1>
              <p className="text-sm text-muted-foreground">to {job.dropoff_address}</p>
            </div>

            <MapPlaceholder pickup={job.pickup_address} dropoff={job.dropoff_address} />

            <div className="surface-card p-5">
              <StatusTracker status={job.status as JobStatus} />
            </div>

            {isAssignedMover && nextAction && (
              <div className="surface-card space-y-4 p-5">
                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Mover actions
                </p>
                {isCompletionStep && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Add a delivery photo before completing this job.
                    </p>
                    <PhotoUploader
                      photos={deliveryPhotos}
                      onChange={setDeliveryPhotos}
                      folder="delivery"
                      label="Add delivery photo"
                    />
                  </div>
                )}
                <Button
                  className="w-full rounded-xl"
                  disabled={advancing}
                  onClick={() => void handleAdvance()}
                >
                  {advancing ? <Loader2 className="h-4 w-4 animate-spin" /> : nextAction.label}
                </Button>
              </div>
            )}

            <div className="surface-card space-y-2 p-5 text-sm">
              <p className="flex justify-between">
                <span className="text-muted-foreground">Vehicle</span>
                <span className="font-medium">
                  {String(job.vehicle_type ?? "").replaceAll("_", " ")}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-muted-foreground">Distance</span>
                <span className="font-medium">{Number(job.distance_miles ?? 0).toFixed(1)} mi</span>
              </p>
              <p className="flex justify-between border-t border-border pt-3 text-base">
                <span className="font-semibold">Total</span>
                <span className="font-extrabold">
                  {formatMoney(Number(job.customer_price ?? 0))}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
