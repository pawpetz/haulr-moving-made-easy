import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, LogOut, Star, Truck } from "lucide-react";
import { AppShell } from "@/components/haulr/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchMoverByUser } from "@/services/movers.service";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account — Haulr" },
      { name: "description", content: "Manage your Haulr profile and contact details." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user, profile, primaryRole, refresh, signOut } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setPhone(profile?.phone ?? "");
    setAddress(profile?.address ?? "");
  }, [profile]);

  const { data: mover } = useQuery({
    queryKey: ["mover-profile", user?.id],
    enabled: Boolean(user?.id) && primaryRole === "mover",
    queryFn: () => fetchMoverByUser(user!.id),
  });

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone: phone || null, address: address || null })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile updated");
    void refresh();
  };

  return (
    <AppShell title="Account" subtitle="Your contact details and profile.">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="surface-card space-y-4 p-5 sm:p-6">
          <div className="space-y-1.5">
            <Label htmlFor="account-name">Full name</Label>
            <Input
              id="account-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-12 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="account-email">Email</Label>
            <Input
              id="account-email"
              value={user?.email ?? ""}
              disabled
              className="h-12 rounded-xl"
            />
            <p className="text-xs text-muted-foreground">
              Email can't be changed here yet — contact support if you need to update it.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="account-phone">Phone</Label>
            <Input
              id="account-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 555-5555"
              className="h-12 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="account-address">Address</Label>
            <Input
              id="account-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Default pickup address (optional)"
              className="h-12 rounded-xl"
            />
          </div>
          <Button className="w-full rounded-xl" disabled={saving} onClick={() => void save()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
          </Button>
        </div>

        {primaryRole === "mover" && mover && (
          <div className="surface-card space-y-3 p-5 sm:p-6">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <Truck className="h-4 w-4" />
              Mover profile
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium">{mover.status.replaceAll("_", " ")}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Rating</span>
              <span className="flex items-center gap-1 font-medium">
                <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                {Number(mover.rating ?? 5).toFixed(1)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Jobs completed</span>
              <span className="font-medium">{mover.jobs_completed}</span>
            </div>
          </div>
        )}

        <Button
          variant="outline"
          className="w-full rounded-xl text-destructive hover:text-destructive"
          onClick={() => void signOut()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </AppShell>
  );
}
