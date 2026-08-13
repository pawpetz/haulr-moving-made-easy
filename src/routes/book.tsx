import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Loader2,
  Plus,
  Trash2,
  Truck,
} from "lucide-react";
import { Logo } from "@/components/haulr/Logo";
import { PhotoUploader } from "@/components/haulr/PhotoUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ACCESS_OPTIONS,
  ADDONS,
  ITEM_SIZES,
  ITEM_TYPES,
  SERVICE_LEVELS,
  VEHICLES,
} from "@/lib/constants";
import type {
  AccessType,
  AddonKey,
  BookingDraft,
  ItemSize,
  ServiceLevel,
  VehicleType,
} from "@/lib/types";
import { calculateEstimate, estimateDistance, formatMoney, recommendVehicle } from "@/lib/pricing";
import { fetchPricingMap } from "@/services/pricing.service";
import { createJob, updateJobStatus } from "@/services/jobs.service";
import { authorizePayment } from "@/services/payments.service";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface BookSearch {
  pickup: string;
  dropoff: string;
  item: string;
  when: string;
}

export const Route = createFileRoute("/book")({
  validateSearch: (search: Record<string, unknown>): BookSearch => ({
    pickup: typeof search["pickup"] === "string" ? search["pickup"] : "",
    dropoff: typeof search["dropoff"] === "string" ? search["dropoff"] : "",
    item: typeof search["item"] === "string" ? search["item"] : "",
    when: typeof search["when"] === "string" ? search["when"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Get a moving estimate — Haulr" },
      {
        name: "description",
        content:
          "Tell us what you're moving, upload photos and get an upfront Haulr estimate in under a minute.",
      },
      { property: "og:title", content: "Get a moving estimate — Haulr" },
      {
        property: "og:description",
        content: "Upfront pricing for furniture, appliances and small moves.",
      },
    ],
  }),
  component: BookPage,
});

const STEPS = ["Locations", "Items", "Access", "Service", "Vehicle", "Estimate"];

function BookPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [vehicleTouched, setVehicleTouched] = useState(false);

  const [draft, setDraft] = useState<BookingDraft>({
    pickupAddress: search.pickup,
    dropoffAddress: search.dropoff,
    distanceMiles: 0,
    items: [
      {
        id: crypto.randomUUID(),
        itemType: search.item || "Couch",
        quantity: 1,
        size: "LARGE",
      },
    ],
    photos: [],
    pickupAccess: "GROUND",
    dropoffAccess: "GROUND",
    pickupFlights: 0,
    dropoffFlights: 0,
    parkingAvailable: true,
    serviceLevel: "FULL_SERVICE",
    addons: [],
    vehicleType: "PICKUP_TRUCK",
    asap: search.when !== "later",
    scheduledFor: null,
    specialInstructions: "",
  });

  const { data: rules } = useQuery({ queryKey: ["pricing"], queryFn: fetchPricingMap });

  const distance = useMemo(
    () => estimateDistance(draft.pickupAddress, draft.dropoffAddress),
    [draft.pickupAddress, draft.dropoffAddress],
  );

  const recommended = useMemo(() => recommendVehicle(draft.items), [draft.items]);
  const vehicleType: VehicleType = vehicleTouched ? draft.vehicleType : recommended;

  const estimate = useMemo(
    () =>
      calculateEstimate(
        {
          distanceMiles: distance,
          items: draft.items,
          pickupFlights: draft.pickupFlights,
          dropoffFlights: draft.dropoffFlights,
          addons: draft.addons,
          vehicleType,
          serviceLevel: draft.serviceLevel,
        },
        rules,
      ),
    [distance, draft, vehicleType, rules],
  );

  const update = (patch: Partial<BookingDraft>) => setDraft((prev) => ({ ...prev, ...patch }));

  const canContinue = () => {
    if (step === 0)
      return draft.pickupAddress.trim().length > 3 && draft.dropoffAddress.trim().length > 3;
    if (step === 1) return draft.items.length > 0 && draft.items.every((i) => i.itemType);
    return true;
  };

  const submit = async () => {
    if (!user) {
      toast.info("Create an account to request your move");
      void navigate({ to: "/auth" });
      return;
    }
    setSubmitting(true);
    try {
      const job = await createJob({
        draft: { ...draft, distanceMiles: distance, vehicleType },
        estimate,
        userId: user.id,
        customerName: profile?.full_name || user.email || "Customer",
        customerPhone: profile?.phone ?? null,
      });
      await authorizePayment({
        jobId: job.id,
        userId: user.id,
        amount: estimate.total,
        platformFee: estimate.platformFee,
        moverPayout: estimate.moverPayout,
      });
      await updateJobStatus(job.id, "SEARCHING", "Matching you with nearby movers");
      toast.success("Job requested — finding you a mover");
      void navigate({ to: "/jobs/$jobId", params: { jobId: job.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not request your job");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-28">
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4">
          <Logo />
          <span className="text-sm text-muted-foreground">
            Step {step + 1} of {STEPS.length}
          </span>
        </div>
        <div className="h-1 w-full bg-secondary">
          <div
            className="h-1 bg-accent transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <h1 className="text-2xl font-bold sm:text-3xl">{STEPS[step]}</h1>

        {step === 0 && (
          <div className="mt-6 space-y-5">
            <div className="surface-card space-y-4 p-5">
              <div className="space-y-1.5">
                <Label>Pickup address</Label>
                <Input
                  value={draft.pickupAddress}
                  onChange={(e) => update({ pickupAddress: e.target.value })}
                  placeholder="123 Main St, Austin, TX"
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Drop-off address</Label>
                <Input
                  value={draft.dropoffAddress}
                  onChange={(e) => update({ dropoffAddress: e.target.value })}
                  placeholder="900 Oak Ave, Austin, TX"
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="rounded-xl bg-secondary px-4 py-3 text-sm">
                Estimated distance:{" "}
                <span className="font-semibold">
                  {distance ? `${distance.toFixed(1)} miles` : "—"}
                </span>
              </div>
            </div>
            <div className="surface-card space-y-3 p-5">
              <Label>When do you need it?</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => update({ asap: true, scheduledFor: null })}
                  className={cn(
                    "h-12 rounded-xl border text-sm font-semibold",
                    draft.asap
                      ? "border-accent bg-accent/15"
                      : "border-border text-muted-foreground",
                  )}
                >
                  ASAP
                </button>
                <button
                  type="button"
                  onClick={() => update({ asap: false })}
                  className={cn(
                    "h-12 rounded-xl border text-sm font-semibold",
                    !draft.asap
                      ? "border-accent bg-accent/15"
                      : "border-border text-muted-foreground",
                  )}
                >
                  Schedule for later
                </button>
              </div>
              {!draft.asap && (
                <Input
                  type="datetime-local"
                  className="h-12 rounded-xl"
                  onChange={(e) =>
                    update({
                      scheduledFor: e.target.value ? new Date(e.target.value).toISOString() : null,
                    })
                  }
                />
              )}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="mt-6 space-y-4">
            {draft.items.map((item, index) => (
              <div key={item.id} className="surface-card space-y-4 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">
                    Item {index + 1}
                  </span>
                  {draft.items.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remove item"
                      onClick={() => update({ items: draft.items.filter((i) => i.id !== item.id) })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Item type</Label>
                    <Select
                      value={item.itemType}
                      onValueChange={(value) =>
                        update({
                          items: draft.items.map((i) =>
                            i.id === item.id ? { ...i, itemType: value } : i,
                          ),
                        })
                      }
                    >
                      <SelectTrigger className="h-12 w-full rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ITEM_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        update({
                          items: draft.items.map((i) =>
                            i.id === item.id
                              ? { ...i, quantity: Math.max(1, Number(e.target.value) || 1) }
                              : i,
                          ),
                        })
                      }
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Approximate size</Label>
                    <Select
                      value={item.size}
                      onValueChange={(value) =>
                        update({
                          items: draft.items.map((i) =>
                            i.id === item.id ? { ...i, size: value as ItemSize } : i,
                          ),
                        })
                      }
                    >
                      <SelectTrigger className="h-12 w-full rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ITEM_SIZES.map((size) => (
                          <SelectItem key={size.value} value={size.value}>
                            {size.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Weight (lbs, optional)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={item.weightLbs ?? ""}
                      onChange={(e) =>
                        update({
                          items: draft.items.map((i) =>
                            i.id === item.id
                              ? e.target.value
                                ? { ...i, weightLbs: Number(e.target.value) }
                                : {
                                    id: i.id,
                                    itemType: i.itemType,
                                    quantity: i.quantity,
                                    size: i.size,
                                  }
                              : i,
                          ),
                        })
                      }
                      className="h-12 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              className="h-12 w-full rounded-xl"
              onClick={() =>
                update({
                  items: [
                    ...draft.items,
                    { id: crypto.randomUUID(), itemType: "Boxes", quantity: 1, size: "SMALL" },
                  ],
                })
              }
            >
              <Plus className="mr-1 h-4 w-4" />
              Add another item
            </Button>

            <div className="surface-card space-y-3 p-5">
              <Label>Photos</Label>
              <p className="text-sm text-muted-foreground">
                Photos help us provide a more accurate estimate.
              </p>
              <PhotoUploader photos={draft.photos} onChange={(photos) => update({ photos })} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-6 space-y-4">
            {(
              [
                { key: "pickupAccess", flights: "pickupFlights", label: "Pickup access" },
                { key: "dropoffAccess", flights: "dropoffFlights", label: "Drop-off access" },
              ] as const
            ).map((section) => (
              <div key={section.key} className="surface-card space-y-3 p-5">
                <Label>{section.label}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {ACCESS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => update({ [section.key]: option.value as AccessType })}
                      className={cn(
                        "h-12 rounded-xl border text-sm font-semibold",
                        draft[section.key] === option.value
                          ? "border-accent bg-accent/15"
                          : "border-border text-muted-foreground",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {draft[section.key] === "STAIRS" && (
                  <div className="space-y-1.5">
                    <Label>Flights of stairs</Label>
                    <Input
                      type="number"
                      min={0}
                      value={draft[section.flights]}
                      onChange={(e) =>
                        update({ [section.flights]: Math.max(0, Number(e.target.value) || 0) })
                      }
                      className="h-12 rounded-xl"
                    />
                  </div>
                )}
              </div>
            ))}

            <div className="surface-card flex items-center justify-between p-5">
              <div>
                <Label>Is parking available?</Label>
                <p className="text-sm text-muted-foreground">At both pickup and drop-off.</p>
              </div>
              <Switch
                checked={draft.parkingAvailable}
                onCheckedChange={(checked) => update({ parkingAvailable: checked })}
              />
            </div>

            <div className="surface-card space-y-2 p-5">
              <Label>Special instructions (optional)</Label>
              <Textarea
                value={draft.specialInstructions}
                onChange={(e) => update({ specialInstructions: e.target.value })}
                placeholder="Gate code, best entrance, fragile items…"
                className="rounded-xl"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-6 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {SERVICE_LEVELS.map((service) => (
                <button
                  key={service.value}
                  type="button"
                  onClick={() => update({ serviceLevel: service.value as ServiceLevel })}
                  className={cn(
                    "surface-card p-5 text-left transition-colors",
                    draft.serviceLevel === service.value && "border-accent bg-accent/10",
                  )}
                >
                  <p className="font-semibold">{service.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{service.description}</p>
                </button>
              ))}
            </div>
            <div className="surface-card space-y-3 p-5">
              <Label>Optional add-ons</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {ADDONS.map((addon) => {
                  const active = draft.addons.includes(addon.value);
                  return (
                    <button
                      key={addon.value}
                      type="button"
                      onClick={() =>
                        update({
                          addons: active
                            ? draft.addons.filter((a) => a !== addon.value)
                            : [...draft.addons, addon.value as AddonKey],
                        })
                      }
                      className={cn(
                        "flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm",
                        active ? "border-accent bg-accent/15" : "border-border",
                      )}
                    >
                      <span>
                        <span className="block font-semibold">{addon.label}</span>
                        <span className="text-xs text-muted-foreground">{addon.hint}</span>
                      </span>
                      {active && <CheckCircle2 className="h-4 w-4 text-accent" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Based on your items we recommend the{" "}
              <span className="font-semibold text-foreground">
                {VEHICLES.find((v) => v.value === recommended)?.label}
              </span>
              .
            </p>
            {VEHICLES.map((vehicle) => (
              <button
                key={vehicle.value}
                type="button"
                onClick={() => {
                  setVehicleTouched(true);
                  update({ vehicleType: vehicle.value });
                }}
                className={cn(
                  "surface-card flex w-full items-center gap-4 p-5 text-left",
                  vehicleType === vehicle.value && "border-accent bg-accent/10",
                )}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
                  <Truck className="h-5 w-5" />
                </span>
                <span className="flex-1">
                  <span className="block font-semibold">{vehicle.label}</span>
                  <span className="text-sm text-muted-foreground">
                    {vehicle.description} {vehicle.capacity}
                  </span>
                </span>
                {vehicle.value === recommended && (
                  <span className="rounded-full bg-accent/20 px-2.5 py-1 text-xs font-semibold">
                    Recommended
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {step === 5 && (
          <div className="mt-6 space-y-4">
            <div className="surface-card p-5">
              <ul className="space-y-3">
                {estimate.lines.map((line) => (
                  <li key={line.key} className="flex items-start justify-between gap-4 text-sm">
                    <span>
                      <span className="block font-medium">{line.label}</span>
                      {line.detail && (
                        <span className="text-xs text-muted-foreground">{line.detail}</span>
                      )}
                    </span>
                    <span className="font-semibold">{formatMoney(line.amount)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-5">
                <span className="text-base font-semibold">Estimated total</span>
                <span className="text-3xl font-extrabold">{formatMoney(estimate.total)}</span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                This is an estimate. The final price may change if the actual job differs
                significantly from the information provided.
              </p>
            </div>

            <div className="surface-card space-y-2 p-5 text-sm">
              <p className="flex justify-between">
                <span className="text-muted-foreground">Vehicle</span>
                <span className="font-medium">
                  {VEHICLES.find((v) => v.value === vehicleType)?.label}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-muted-foreground">Estimated duration</span>
                <span className="font-medium">{estimate.laborHours} hr</span>
              </p>
              <p className="flex justify-between">
                <span className="text-muted-foreground">Distance</span>
                <span className="font-medium">{distance.toFixed(1)} mi</span>
              </p>
            </div>

            {!user && (
              <p className="text-center text-sm text-muted-foreground">
                <Link to="/auth" className="font-semibold underline underline-offset-4">
                  Log in or create an account
                </Link>{" "}
                to request this move.
              </p>
            )}
          </div>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 p-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
          {step > 0 && (
            <Button
              variant="outline"
              className="h-13 rounded-xl"
              onClick={() => setStep((s) => s - 1)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button
              className="h-13 flex-1 rounded-xl text-base"
              disabled={!canContinue()}
              onClick={() => setStep((s) => s + 1)}
            >
              Continue
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              className="h-13 flex-1 rounded-xl text-base"
              disabled={submitting}
              onClick={() => void submit()}
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="mr-2 h-4 w-4" />
              )}
              Request job · {formatMoney(estimate.total)}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
