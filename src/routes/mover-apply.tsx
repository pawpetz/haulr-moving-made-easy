import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/haulr/AppShell";
import { DocumentUploader } from "@/components/haulr/DocumentUploader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VEHICLES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { VehicleType } from "@/lib/types";

export const Route = createFileRoute("/mover-apply")({
  head: () => ({
    meta: [
      { title: "Become a Haulr mover" },
      {
        name: "description",
        content: "Turn your truck or van into income. Apply to haul on Haulr in minutes.",
      },
      { property: "og:title", content: "Become a Haulr mover" },
      { property: "og:description", content: "Drive a truck? Start earning with Haulr." },
    ],
  }),
  component: MoverApplyPage,
});

function MoverApplyPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [vehicleType, setVehicleType] = useState<VehicleType>("PICKUP_TRUCK");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseState, setLicenseState] = useState("");
  const [licenseExpires, setLicenseExpires] = useState("");
  const [licenseDocUrl, setLicenseDocUrl] = useState<string | null>(null);
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [insurancePolicy, setInsurancePolicy] = useState("");
  const [insuranceExpires, setInsuranceExpires] = useState("");
  const [insuranceDocUrl, setInsuranceDocUrl] = useState<string | null>(null);
  const [backgroundCheckConsent, setBackgroundCheckConsent] = useState(false);

  useEffect(() => {
    if (authLoading || user) return;
    void navigate({ to: "/auth", search: { redirect: "/mover-apply" } });
  }, [authLoading, user, navigate]);

  const apply = async () => {
    if (!user) return;
    setBusy(true);
    const { data: moverProfile, error } = await supabase
      .from("mover_profiles")
      .insert({
        user_id: user.id,
        full_name: profile?.full_name || user.email || "New mover",
        email: user.email ?? null,
        service_area: city,
        bio: bio || null,
        business_name: businessName || null,
        license_number: licenseNumber || null,
        license_state: licenseState || null,
        license_expires_at: licenseExpires || null,
        license_doc_url: licenseDocUrl,
        insurance_provider: insuranceProvider || null,
        insurance_policy: insurancePolicy || null,
        insurance_expires_at: insuranceExpires || null,
        insurance_doc_url: insuranceDocUrl,
        background_check_consent: backgroundCheckConsent,
        background_check_consented_at: backgroundCheckConsent ? new Date().toISOString() : null,
        background_check_status: backgroundCheckConsent ? "PENDING" : "NOT_STARTED",
      })
      .select("id")
      .single();
    if (error) {
      setBusy(false);
      toast.error(error.message);
      return;
    }

    const { error: vehicleError } = await supabase.from("vehicles").insert({
      mover_id: moverProfile.id,
      type: vehicleType,
    });
    setBusy(false);
    if (vehicleError) {
      toast.error(vehicleError.message);
      return;
    }
    toast.success("Application submitted — we'll review it shortly");
    void navigate({ to: "/mover" });
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-2xl px-4 py-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Become a mover</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us about your vehicle and service area.
        </p>

        <div className="mt-6 space-y-4">
          <div className="surface-card space-y-3 p-5">
            <Label>Primary vehicle</Label>
            <div className="grid gap-2">
              {VEHICLES.map((vehicle) => (
                <button
                  key={vehicle.value}
                  type="button"
                  onClick={() => setVehicleType(vehicle.value)}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left text-sm",
                    vehicleType === vehicle.value ? "border-accent bg-accent/15" : "border-border",
                  )}
                >
                  <span className="block font-semibold">{vehicle.label}</span>
                  <span className="text-xs text-muted-foreground">{vehicle.capacity}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="surface-card space-y-3 p-5">
            <div className="space-y-1.5">
              <Label>Your name</Label>
              <Input value={profile?.full_name ?? ""} disabled className="h-12 rounded-xl" />
              <p className="text-xs text-muted-foreground">
                This is how customers will see you. Update it on your{" "}
                <a href="/account" className="underline underline-offset-2">
                  Account page
                </a>{" "}
                if it's wrong.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Business name (optional)</Label>
              <Input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Sam's Moving Co."
                className="h-12 rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                If you operate under a business name, customers will see that instead of your
                personal name.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Service city</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Austin, TX"
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Short bio</Label>
              <Input
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="5 years moving furniture, own dollies and straps"
                className="h-12 rounded-xl"
              />
            </div>
          </div>

          <div className="surface-card space-y-3 p-5">
            <div>
              <Label className="text-sm font-semibold">Driver's license</Label>
              <p className="text-xs text-muted-foreground">
                Required before you can accept jobs. An admin will review it.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>License number</Label>
                <Input
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Issuing state</Label>
                <Input
                  value={licenseState}
                  onChange={(e) => setLicenseState(e.target.value)}
                  placeholder="MD, DC, VA…"
                  className="h-12 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Expiration date</Label>
              <Input
                type="date"
                value={licenseExpires}
                onChange={(e) => setLicenseExpires(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
            <DocumentUploader
              url={licenseDocUrl}
              onChange={setLicenseDocUrl}
              label="License photo"
            />
          </div>

          <div className="surface-card space-y-3 p-5">
            <div>
              <Label className="text-sm font-semibold">Insurance</Label>
              <p className="text-xs text-muted-foreground">
                Required before you can accept jobs. An admin will review it.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Insurance provider</Label>
                <Input
                  value={insuranceProvider}
                  onChange={(e) => setInsuranceProvider(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Policy number</Label>
                <Input
                  value={insurancePolicy}
                  onChange={(e) => setInsurancePolicy(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Expiration date</Label>
              <Input
                type="date"
                value={insuranceExpires}
                onChange={(e) => setInsuranceExpires(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
            <DocumentUploader
              url={insuranceDocUrl}
              onChange={setInsuranceDocUrl}
              label="Insurance certificate"
            />
          </div>

          <div className="surface-card space-y-3 p-5">
            <div>
              <Label className="text-sm font-semibold">Background check</Label>
              <p className="text-xs text-muted-foreground">
                Since movers enter customers' homes, Haulr requires a background check before you
                can accept jobs.
              </p>
            </div>
            <label className="flex items-start gap-3 rounded-xl border border-border p-3 text-sm">
              <Checkbox
                checked={backgroundCheckConsent}
                onCheckedChange={(v) => setBackgroundCheckConsent(v === true)}
                className="mt-0.5"
              />
              <span>
                I authorize Haulr to run a background check as part of my application, and
                understand I'll be notified before any adverse decision based on the results.
              </span>
            </label>
          </div>

          <Button
            className="h-12 w-full rounded-xl text-base"
            disabled={busy || !city || !backgroundCheckConsent}
            onClick={() => void apply()}
          >
            Submit application
          </Button>
          {!backgroundCheckConsent && (
            <p className="text-center text-xs text-muted-foreground">
              You must authorize a background check to submit your application.
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
