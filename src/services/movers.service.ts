import { supabase } from "@/integrations/supabase/client";
import type { MoverStatus, VehicleType } from "@/lib/types";

export async function fetchMovers() {
  const { data, error } = await supabase
    .from("mover_profiles")
    .select("*, vehicles(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchMoverByUser(userId: string) {
  const { data, error } = await supabase
    .from("mover_profiles")
    .select("*, vehicles(*)")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export interface MoverApplication {
  full_name: string;
  phone: string;
  email: string;
  address: string;
  license_number: string;
  license_state: string;
  insurance_provider: string;
  insurance_policy: string;
  service_area: string;
  photo_url: string | null;
  vehicle: {
    type: VehicleType;
    year: number;
    make: string;
    model: string;
    photo_url: string | null;
  };
}

export async function submitMoverApplication(userId: string, app: MoverApplication) {
  const { vehicle, ...profile } = app;
  const { data, error } = await supabase
    .from("mover_profiles")
    .insert({ ...profile, user_id: userId, status: "UNDER_REVIEW" })
    .select("id")
    .single();
  if (error) throw error;

  const { error: vehicleError } = await supabase.from("vehicles").insert({
    mover_id: data.id,
    type: vehicle.type,
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    photo_url: vehicle.photo_url,
  });
  if (vehicleError) throw vehicleError;
  return data;
}

export async function setMoverOnline(moverId: string, online: boolean) {
  const { error } = await supabase
    .from("mover_profiles")
    .update({ is_online: online })
    .eq("id", moverId);
  if (error) throw error;
}

export async function setMoverStatus(moverId: string, status: MoverStatus) {
  const { error } = await supabase.from("mover_profiles").update({ status }).eq("id", moverId);
  if (error) throw error;
}

export async function fetchMoverPayouts(moverId: string) {
  const { data, error } = await supabase
    .from("payouts")
    .select("*, job:jobs(reference, created_at, status)")
    .eq("mover_id", moverId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
