import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  Boxes,
  CalendarClock,
  CheckCircle2,
  Clock,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Sofa,
  Sparkles,
  Trash2,
  Truck,
  Users,
  WashingMachine,
} from "lucide-react";
import { Logo } from "@/components/haulr/Logo";
import heroMovers from "@/assets/hero-movers.jpg";
import truckLoading from "@/assets/truck-loading.jpg";
import moverPortrait from "@/assets/mover-portrait.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ITEM_TYPES } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Haulr — Big stuff. Moved easy." },
      {
        name: "description",
        content:
          "Book a trusted local mover to pick up, load, transport and deliver your furniture and large items. Upfront pricing, tracked delivery.",
      },
      { property: "og:title", content: "Haulr — Big stuff. Moved easy." },
      {
        property: "og:description",
        content:
          "On-demand moving and large item delivery. Get an upfront estimate and get matched with a local mover.",
      },
    ],
  }),
  component: Landing,
});

const SERVICES = [
  { icon: Sofa, title: "Furniture Delivery", copy: "Get furniture picked up and delivered." },
  {
    icon: PackageCheck,
    title: "Marketplace Pickup",
    copy: "Buy something online? Haulr picks it up and brings it to you.",
  },
  { icon: Boxes, title: "Small Moves", copy: "Apartments, dorms, rooms, and small offices." },
  {
    icon: WashingMachine,
    title: "Appliance Delivery",
    copy: "Move refrigerators, washers, dryers, and other large appliances.",
  },
  {
    icon: Users,
    title: "Labor Only",
    copy: "Need help loading or unloading? Hire movers without a truck.",
  },
  {
    icon: Trash2,
    title: "Junk Removal",
    copy: "Request pickup and hauling of unwanted large items.",
  },
];

const STEPS = [
  { title: "Tell us what you're moving", copy: "Enter locations and upload photos." },
  { title: "Get an upfront estimate", copy: "See your estimated price before requesting the job." },
  { title: "Get matched with a mover", copy: "A qualified local mover accepts your job." },
  { title: "Track your delivery", copy: "Follow the job from pickup to drop-off." },
];

function Landing() {
  const navigate = useNavigate();
  const { user, activeRole } = useAuth();
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [item, setItem] = useState("Couch");
  const [when, setWhen] = useState("asap");

  const startBooking = () => {
    void navigate({ to: "/book", search: { pickup, dropoff, item, when } });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#services" className="hover:text-foreground">
              Services
            </a>
            <a href="#how" className="hover:text-foreground">
              How it works
            </a>
            <Link to="/mover-apply" className="hover:text-foreground">
              Become a Mover
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Button asChild size="sm">
                <Link
                  to={
                    activeRole === "mover"
                      ? "/mover"
                      : activeRole === "admin"
                        ? "/admin"
                        : "/dashboard"
                  }
                >
                  Dashboard
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/auth" search={{ redirect: "" }}>
                    Log in
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/book" search={{ pickup: "", dropoff: "", item: "", when: "" }}>
                    Get a Quote
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="relative isolate overflow-hidden bg-ink">
        <img
          src={heroMovers}
          alt="Two Haulr movers carrying a grey sofa into an open box truck on a sunny street"
          width={1600}
          height={1104}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[70%_50%]"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(100deg,color-mix(in_oklab,var(--ink)_96%,transparent)_0%,color-mix(in_oklab,var(--ink)_88%,transparent)_30%,color-mix(in_oklab,var(--ink)_45%,transparent)_62%,color-mix(in_oklab,var(--ink)_18%,transparent)_100%)]" />
        <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[1.05fr_1fr] lg:py-20">
          <div className="flex flex-col justify-center text-ink-foreground">
            <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-ink-foreground/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              On-demand moving marketplace
            </span>
            <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
              Big stuff.
              <br />
              Moved easy.
            </h1>
            <p className="mt-5 max-w-md text-base text-ink-foreground/75 sm:text-lg">
              Book a trusted local mover to pick up, load, transport, and deliver your furniture and
              large items.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button size="lg" className="h-13 rounded-xl px-7 text-base" onClick={startBooking}>
                Get a Quote
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-13 rounded-xl border-ink-foreground/25 bg-transparent px-7 text-base text-ink-foreground hover:bg-ink-foreground/10 hover:text-ink-foreground"
              >
                <Link to="/mover-apply">Become a Mover</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-foreground/70">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-accent" /> Vetted, insured movers
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-accent" /> Same-day availability
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-accent" /> Upfront pricing
              </span>
            </div>
          </div>

          <div className="surface-card space-y-4 p-5 text-foreground sm:p-6">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Pickup
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
                <Input
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  placeholder="Enter pickup address"
                  className="h-12 rounded-xl pl-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Drop-off
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                <Input
                  value={dropoff}
                  onChange={(e) => setDropoff(e.target.value)}
                  placeholder="Enter destination"
                  className="h-12 rounded-xl pl-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                What are you moving?
              </Label>
              <Select value={item} onValueChange={setItem}>
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
              <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                When?
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "asap", label: "ASAP", icon: Clock },
                  { value: "later", label: "Schedule later", icon: CalendarClock },
                ].map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setWhen(option.value)}
                      className={
                        "flex h-12 items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-semibold transition-colors sm:gap-2 sm:text-sm " +
                        (when === option.value
                          ? "border-accent bg-accent/15 text-foreground"
                          : "border-border bg-card text-muted-foreground")
                      }
                    >
                      <Icon className="h-4 w-4" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <Button className="h-13 w-full rounded-xl text-base" size="lg" onClick={startBooking}>
              Get My Estimate
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Free estimate. No card required to see pricing.
            </p>
          </div>
        </div>
      </section>

      <section id="services" className="mx-auto w-full max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-bold">Everything you need hauled</h2>
        <p className="mt-2 max-w-xl text-muted-foreground">
          One marketplace for furniture, appliances, marketplace pickups and small moves.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.title}
                className="surface-card p-6 transition-shadow hover:shadow-lift"
              >
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="text-lg font-semibold">{service.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{service.copy}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl items-center gap-8 px-4 pb-4 md:grid-cols-2">
        <img
          src={truckLoading}
          alt="Box truck loaded with wrapped furniture and moving blankets on a suburban street"
          width={1280}
          height={864}
          loading="lazy"
          className="h-64 w-full rounded-3xl object-cover shadow-lift sm:h-80"
        />
        <div>
          <h2 className="text-3xl font-bold">Right truck, right crew, every time</h2>
          <p className="mt-3 text-muted-foreground">
            From a single armchair in a pickup to a full studio apartment in a box truck, Haulr
            matches your load with movers who bring blankets, straps, and dollies as standard.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-accent" /> Background-checked crews
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-accent" /> Damage protection included
            </span>
          </div>
        </div>
      </section>

      <section id="how" className="bg-secondary/60 py-16">
        <div className="mx-auto w-full max-w-6xl px-4">
          <h2 className="text-3xl font-bold">How it works</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {STEPS.map((step, index) => (
              <div key={step.title} className="surface-card p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-bold text-ink-foreground">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{step.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="ink-panel grid items-center gap-8 overflow-hidden rounded-3xl md:grid-cols-[1.2fr_1fr]">
          <div className="p-8 sm:p-12">
            <h2 className="text-2xl font-bold sm:text-3xl">
              Own a truck? Start earning this week.
            </h2>
            <p className="mt-2 max-w-lg text-ink-foreground/75">
              Movers keep 80% of every job. Set your own hours, go online when you want, get paid
              after each completed haul.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-6 h-13 rounded-xl bg-accent px-7 text-base text-accent-foreground hover:bg-accent/90"
            >
              <Link to="/mover-apply">
                <Truck className="mr-1 h-4 w-4" />
                Become a Mover
              </Link>
            </Button>
          </div>
          <img
            src={moverPortrait}
            alt="Smiling Haulr mover wheeling a washing machine on a hand truck"
            width={1024}
            height={1024}
            loading="lazy"
            className="h-full max-h-80 w-full object-cover"
          />
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <p className="text-sm text-muted-foreground">
            Big stuff. Moved easy. © {new Date().getFullYear()} Haulr.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link to="/auth" search={{ redirect: "" }} className="hover:text-foreground">
              Log in
            </Link>
            <Link
              to="/book"
              search={{ pickup: "", dropoff: "", item: "", when: "" }}
              className="hover:text-foreground"
            >
              Get a quote
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
