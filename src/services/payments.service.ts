import { supabase } from "@/integrations/supabase/client";

/**
 * Payments adapter.
 *
 * Today this records an authorized payment row using a mock provider so the
 * demo flow works end to end. When Stripe keys are configured, swap
 * `createPaymentIntent` for a server function that creates a real PaymentIntent
 * and have `confirmPayment` react to the Stripe webhook instead.
 * Mover payouts are designed to run through Stripe Connect transfers using the
 * `payouts` table as the ledger.
 */
export const STRIPE_ENABLED = Boolean(import.meta.env["VITE_STRIPE_PUBLISHABLE_KEY"]);

export interface PaymentRequest {
  jobId: string;
  userId: string;
  amount: number;
  platformFee: number;
  moverPayout: number;
}

export async function authorizePayment(req: PaymentRequest) {
  const { data, error } = await supabase
    .from("payments")
    .insert({
      job_id: req.jobId,
      customer_user_id: req.userId,
      provider: STRIPE_ENABLED ? "stripe" : "stripe_mock",
      provider_payment_id: `pi_mock_${Math.random().toString(36).slice(2, 12)}`,
      amount: req.amount,
      platform_fee: req.platformFee,
      mover_payout: req.moverPayout,
      status: "AUTHORIZED",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function fetchPayments() {
  const { data, error } = await supabase
    .from("payments")
    .select("*, job:jobs(reference, customer_name, status)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}
