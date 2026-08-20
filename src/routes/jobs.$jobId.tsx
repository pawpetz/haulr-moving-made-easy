import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Phone, Star, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/haulr/AppShell";
import { StatusTracker } from "@/components/haulr/StatusTracker";
import { MapPlaceholder } from "@/components/haulr/MapPlaceholder";
import { PhotoUploader } from "@/components/haulr/PhotoUploader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fetchJobRating, rateJob, updateJobStatus } from "@/services/jobs.service";
import { formatMoney } from "@/lib/pricing";
import { MOVER_ACTIONS, VEHICLE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { JobStatus, VehicleType } from "@/lib/types";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

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

  const { data: assignedMover } = useQuery({
    queryKey: ["job-mover", job?.mover_id],
    enabled: Boolean(job?.mover_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mover_profiles")
        .select("id, full_name, rating, photo_url, vehicles(type)")
        .eq("id", job!.mover_id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const isAssignedMover = Boolean(user && job && job.mover_user_id === user.id);
  const isJobCustomer = Boolean(user && job && job.customer_user_id === user.id);
  const nextAction = job ? MOVER_ACTIONS.find((a) => a.from === job.status) : undefined;
  const isCompletionStep = nextAction?.to === "COMPLETED";

  const { data: rating, isLoading: ratingLoading } = useQuery({
    queryKey: ["job-rating", jobId],
    enabled: Boolean(job) && job?.status === "COMPLETED",
    queryFn: () => fetchJobRating(jobId),
  });

  const [stars, setStars] = useState(0);
  const [review, setReview] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  const submitRating = async () => {
    if (!job || !user || stars === 0) {
      toast.error("Pick a star rating first");
      return;
    }
    setSubmittingRating(true);
    try {
      await rateJob({
        jobId: job.id,
        moverId: job.mover_id,
        userId: user.id,
        stars,
        review,
      });
      void queryClient.invalidateQueries({ queryKey: ["job-rating", jobId] });
      toast.success("Thanks for the feedback!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit rating");
    } finally {
      setSubmittingRating(false);
    }
  };

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

            {isJobCustomer && assignedMover && (
              <div className="surface-card flex items-center gap-3 p-5">
                <Avatar className="h-11 w-11">
                  {assignedMover.photo_url && <AvatarImage src={assignedMover.photo_url} />}
                  <AvatarFallback className="bg-secondary text-sm font-semibold">
                    {initials(assignedMover.full_name || "Mover")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {assignedMover.full_name || "Your mover"}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-accent text-accent" />
                      {Number(assignedMover.rating ?? 5).toFixed(1)}
                    </span>
                    {assignedMover.vehicles?.[0]?.type && (
                      <span className="flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        {VEHICLE_LABELS[assignedMover.vehicles[0].type as VehicleType]}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isAssignedMover && nextAction && (
              <div className="surface-card space-y-4 p-5">
                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Mover actions
                </p>
                {job.customer_name && (
                  <div className="flex items-center justify-between rounded-xl bg-secondary/60 px-4 py-3 text-sm">
                    <span className="text-muted-foreground">Customer</span>
                    <span className="flex items-center gap-2 font-medium">
                      {job.customer_name}
                      {job.customer_phone && (
                        <a
                          href={`tel:${job.customer_phone}`}
                          className="flex items-center gap-1 text-accent-foreground"
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </span>
                  </div>
                )}
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

            {isJobCustomer && job.status === "COMPLETED" && !ratingLoading && (
              <div className="surface-card space-y-4 p-5">
                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {rating ? "Your rating" : "Rate this move"}
                </p>
                {rating ? (
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={cn(
                            "h-6 w-6",
                            n <= rating.stars
                              ? "fill-accent text-accent"
                              : "fill-transparent text-border",
                          )}
                        />
                      ))}
                    </div>
                    {rating.review && (
                      <p className="text-sm text-muted-foreground">{rating.review}</p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          aria-label={`${n} star${n === 1 ? "" : "s"}`}
                          onClick={() => setStars(n)}
                        >
                          <Star
                            className={cn(
                              "h-8 w-8 transition-colors",
                              n <= stars
                                ? "fill-accent text-accent"
                                : "fill-transparent text-border hover:text-accent/60",
                            )}
                          />
                        </button>
                      ))}
                    </div>
                    <Textarea
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      placeholder="Optional — how did it go?"
                      className="rounded-xl"
                    />
                    <Button
                      className="w-full rounded-xl"
                      disabled={submittingRating}
                      onClick={() => void submitRating()}
                    >
                      {submittingRating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Submit rating"
                      )}
                    </Button>
                  </>
                )}
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
