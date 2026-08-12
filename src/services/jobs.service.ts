import { supabase } from "@/integrations/supabase/client";
import type { BookingDraft, JobStatus } from "@/lib/types";
import type { Estimate } from "@/lib/pricing";

export interface JobRow {
  id: string;
  reference: string;
  customer_user_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  mover_id: string | null;
  mover_user_id: string | null;
  pickup_address: string;
  dropoff_address: string;
  distance_miles: number;
  pickup_access: string;
  dropoff_access: string;
  pickup_flights: number;
  dropoff_flights: number;
  parking_available: boolean;
  service_level: string;
  addons: unknown;
  vehicle_type: "PICKUP_TRUCK" | "CARGO_VAN" | "BOX_TRUCK";
  scheduled_for: string | null;
  asap: boolean;
  estimated_minutes: number;
  price_breakdown: unknown;
  customer_price: number;
  platform_fee: number;
  mover_payout: number;
  status: JobStatus;
  special_instructions: string | null;
  is_demo: boolean;
  created_at: string;
}

const JOB_SELECT = "*, mover:mover_profiles(*), items:job_items(*), photos:job_photos(*)";

export async function createJob(params: {
  draft: BookingDraft;
  estimate: Estimate;
  userId: string;
  customerName: string;
  customerPhone: string | null;
}) {
  const { draft, estimate, userId } = params;
  const { data, error } = await supabase
    .from("jobs")
    .insert({
      customer_user_id: userId,
      customer_name: params.customerName,
      customer_phone: params.customerPhone,
      pickup_address: draft.pickupAddress,
      dropoff_address: draft.dropoffAddress,
      distance_miles: draft.distanceMiles,
      pickup_access: draft.pickupAccess,
      dropoff_access: draft.dropoffAccess,
      pickup_flights: draft.pickupFlights,
      dropoff_flights: draft.dropoffFlights,
      parking_available: draft.parkingAvailable,
      service_level: draft.serviceLevel,
      addons: draft.addons,
      vehicle_type: draft.vehicleType,
      asap: draft.asap,
      scheduled_for: draft.scheduledFor,
      estimated_minutes: estimate.estimatedMinutes,
      price_breakdown: JSON.parse(JSON.stringify(estimate)),
      customer_price: estimate.total,
      platform_fee: estimate.platformFee,
      mover_payout: estimate.moverPayout,
      special_instructions: draft.specialInstructions || null,
      status: "REQUESTED",
    })
    .select("id, reference")
    .single();
  if (error) throw error;

  if (draft.items.length) {
    const { error: itemError } = await supabase.from("job_items").insert(
      draft.items.map((item) => ({
        job_id: data.id,
        item_type: item.itemType,
        quantity: item.quantity,
        size: item.size,
        weight_lbs: item.weightLbs ?? null,
      })),
    );
    if (itemError) throw itemError;
  }

  if (draft.photos.length) {
    await supabase
      .from("job_photos")
      .insert(draft.photos.map((url) => ({ job_id: data.id, url, phase: "REQUEST" })));
  }

  await addStatus(data.id, "REQUESTED", "Job requested by customer");
  return data;
}

export async function addStatus(jobId: string, status: JobStatus, note?: string) {
  await supabase.from("job_status_history").insert({ job_id: jobId, status, note: note ?? null });
}

export async function updateJobStatus(jobId: string, status: JobStatus, note?: string) {
  const { error } = await supabase
    .from("jobs")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", jobId);
  if (error) throw error;
  await addStatus(jobId, status, note);
}

export async function fetchJob(jobId: string) {
  const { data, error } = await supabase.from("jobs").select(JOB_SELECT).eq("id", jobId).single();
  if (error) throw error;
  return data;
}

export async function fetchJobHistory(jobId: string) {
  const { data, error } = await supabase
    .from("job_status_history")
    .select("*")
    .eq("job_id", jobId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchCustomerJobs(userId: string) {
  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_SELECT)
    .eq("customer_user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchOpenJobs() {
  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_SELECT)
    .in("status", ["REQUESTED", "SEARCHING"])
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data ?? [];
}

export async function fetchMoverJobs(userId: string) {
  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_SELECT)
    .eq("mover_user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllJobs() {
  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_SELECT)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data ?? [];
}

export async function acceptJob(jobId: string, moverId: string, moverUserId: string) {
  const { error } = await supabase
    .from("jobs")
    .update({ mover_id: moverId, mover_user_id: moverUserId, status: "MOVER_ASSIGNED" })
    .eq("id", jobId);
  if (error) throw error;
  await addStatus(jobId, "MOVER_ASSIGNED", "Mover accepted the job");
}

export async function addJobPhoto(jobId: string, url: string, phase: string) {
  const { error } = await supabase.from("job_photos").insert({ job_id: jobId, url, phase });
  if (error) throw error;
}

export async function rateJob(params: {
  jobId: string;
  moverId: string | null;
  userId: string;
  stars: number;
  review: string;
}) {
  const { error } = await supabase.from("ratings").insert({
    job_id: params.jobId,
    mover_id: params.moverId,
    customer_user_id: params.userId,
    stars: params.stars,
    review: params.review || null,
  });
  if (error) throw error;
}

export async function fetchJobRating(jobId: string) {
  const { data } = await supabase.from("ratings").select("*").eq("job_id", jobId).maybeSingle();
  return data;
}
