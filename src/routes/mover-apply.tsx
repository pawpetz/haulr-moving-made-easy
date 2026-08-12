import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/haulr/AppShell";
import { Button } from "@/components/ui/button";
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [vehicleType, setVehicleType] = useState<VehicleType>("PICKUP_TRUCK");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");

  const apply = async () => {
    if (!user) {
      void navigate({ to: "/auth" });
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("mover_profiles").insert({
      user_id: user.id,
      service_city: city,
      bio,
      primary_vehicle: vehicleType,
      approval_status: "PENDING",
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Application submitted — we'll review it shortly");
    void navigate({ to: "/mover" });
  };

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

          <Button
            className="h-12 w-full rounded-xl text-base"
            disabled={busy || !city}
            onClick={() => void apply()}
          >
            Submit application
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
