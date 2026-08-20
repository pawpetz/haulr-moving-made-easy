import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Loader2, LogOut, Star, Truck } from "lucide-react";
import { AppShell } from "@/components/haulr/AppShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchMoverByUser } from "@/services/movers.service";
import { useQuery } from "@tanstack/react-query";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

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

  const uploadAvatar = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      const path = `avatars/${user.id}-${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "-")}`;
      const { error: uploadError } = await supabase.storage.from("job-photos").upload(path, file);
      if (uploadError) throw uploadError;
      const { data: signed, error: signError } = await supabase.storage
        .from("job-photos")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      if (signError) throw signError;
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: signed.signedUrl })
        .eq("user_id", user.id);
      if (updateError) throw updateError;
      toast.success("Photo updated");
      void refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

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
        <div className="surface-card flex items-center gap-4 p-5 sm:p-6">
          <div className="relative">
            <Avatar className="h-16 w-16">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
              <AvatarFallback className="bg-secondary text-lg font-semibold">
                {initials(profile?.full_name || user?.email || "You")}
              </AvatarFallback>
            </Avatar>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void uploadAvatar(e.target.files)}
            />
            <button
              type="button"
              aria-label="Change profile photo"
              disabled={uploadingAvatar}
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-ink text-ink-foreground shadow-soft transition-transform hover:scale-105"
            >
              {uploadingAvatar ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          <div>
            <p className="font-semibold">{profile?.full_name || "Your profile"}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

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
