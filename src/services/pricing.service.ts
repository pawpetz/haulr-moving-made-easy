import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_PRICING, type PricingRules } from "@/lib/pricing";

export interface PricingRuleRow {
  key: string;
  label: string;
  value: number;
  unit: string;
}

export async function fetchPricingRules(): Promise<PricingRuleRow[]> {
  const { data, error } = await supabase.from("pricing_rules").select("*").order("key");
  if (error) throw error;
  return (data ?? []).map((row) => ({ ...row, value: Number(row.value) }));
}

export async function fetchPricingMap(): Promise<PricingRules> {
  try {
    const rows = await fetchPricingRules();
    if (!rows.length) return DEFAULT_PRICING;
    return rows.reduce<PricingRules>(
      (acc, row) => ({ ...acc, [row.key]: row.value }),
      { ...DEFAULT_PRICING },
    );
  } catch {
    return DEFAULT_PRICING;
  }
}

export async function updatePricingRule(key: string, value: number) {
  const { error } = await supabase
    .from("pricing_rules")
    .update({ value, updated_at: new Date().toISOString() })
    .eq("key", key);
  if (error) throw error;
}
