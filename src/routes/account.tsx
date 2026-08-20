import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Camera, Loader2, LogOut, ShieldCheck, Star, Truck } from "lucide-react";
import { AppShell } from "@/components/haulr/AppShell";
import { DocumentUploader } from "@/components/haulr/DocumentUploader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchMoverByUser } from "@/services/movers.service";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function expiryStatus(
  dateStr: string | null,
): { label: string; tone: "ok" | "warn" | "bad" } | null {
  if (!dateStr) return null;
  const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return { label: "Expired", tone: "bad" };
  if (days <= 30) return { label: `Expires in ${days} day${days === 1 ? "" : "s"}`, tone: "warn" };
  return { label: `Valid until ${dateStr}`, tone: "ok" };
}

const COMPLIANCE_LABEL: Record<string, string> = {
  PENDING_REVIEW: "Pending review",
  APPROVED: "Approved",
  ACTION_REQUIRED: "Action required",
};

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
  const { user, profile, roles, loading: authLoading, refresh, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [licenseExpires, setLicenseExpires] = useState("");
  const [licenseDocUrl, setLicenseDocUrl] = useState<string | null>(null);
  const [insuranceExpires, setInsuranceExpires] = useState("");
  const [insuranceDocUrl, setInsuranceDocUrl] = useState<string | null>(null);
  const [savingCompliance, setSavingCompliance] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setPhone(profile?.phone ?? "");
    setAddress(profile?.address ?? "");
  }, [profile]);

  const { data: mover } = useQuery({
    queryKey: ["mover-profile", user?.id],
    enabled: Boolean(user?.id) && roles.includes("mover"),
    queryFn: () => fetchMoverByUser(user!.id),
  });

  useEffect(() => {
    setLicenseExpires(mover?.license_expires_at ?? "");
    setLicenseDocUrl(mover?.license_doc_url ?? null);
    setInsuranceExpires(mover?.insurance_expires_at ?? "");
    setInsuranceDocUrl(mover?.insurance_doc_url ?? null);
  }, [mover]);

  const saveCompliance = async () => {
    if (!mover) return;
    setSavingCompliance(true);
    const { error } = await supabase
      .from("mover_profiles")
      .update({
        license_expires_at: licenseExpires || null,
        license_doc_url: licenseDocUrl,
        insurance_expires_at: insuranceExpires || null,
        insurance_doc_url: insuranceDocUrl,
      })
      .eq("id", mover.id);
    setSavingCompliance(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Compliance documents updated");
    void queryClient.invalidateQueries({ queryKey: ["mover-profile", user?.id] });
  };

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

  if (authLoading) {
    return (
      <AppShell title="Account" subtitle="Your contact details and profile.">
        <div className="mx-auto max-w-lg space-y-6">
          <div className="surface-card h-24 animate-pulse" />
          <div className="surface-card h-72 animate-pulse" />
        </div>
      </AppShell>
    );
  }

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

        {roles.includes("mover") && mover && (
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

        {roles.includes("mover") && mover && (
          <div className="surface-card space-y-4 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
                Compliance
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  mover.compliance_status === "APPROVED" && "bg-success/15 text-success",
                  mover.compliance_status === "PENDING_REVIEW" &&
                    "bg-accent/20 text-accent-foreground",
                  mover.compliance_status === "ACTION_REQUIRED" &&
                    "bg-destructive/10 text-destructive",
                )}
              >
                {COMPLIANCE_LABEL[mover.compliance_status] ?? mover.compliance_status}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Background check</span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  mover.background_check_status === "PASSED" && "bg-success/15 text-success",
                  mover.background_check_status === "PENDING" &&
                    "bg-accent/20 text-accent-foreground",
                  mover.background_check_status === "NOT_STARTED" &&
                    "bg-secondary text-muted-foreground",
                  mover.background_check_status === "FAILED" &&
                    "bg-destructive/10 text-destructive",
                )}
              >
                {mover.background_check_status.replaceAll("_", " ")}
              </span>
            </div>

            {mover.compliance_notes && (
              <div className="flex items-start gap-2 rounded-xl bg-secondary/60 px-3 py-2.5 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent-foreground" />
                <p>{mover.compliance_notes}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>License expiration</Label>
              <Input
                type="date"
                value={licenseExpires}
                onChange={(e) => setLicenseExpires(e.target.value)}
                className="h-11 rounded-xl"
              />
              {expiryStatus(mover.license_expires_at) && (
                <p
                  className={cn(
                    "text-xs",
                    expiryStatus(mover.license_expires_at)?.tone === "bad" && "text-destructive",
                    expiryStatus(mover.license_expires_at)?.tone === "warn" &&
                      "text-accent-foreground",
                    expiryStatus(mover.license_expires_at)?.tone === "ok" &&
                      "text-muted-foreground",
                  )}
                >
                  {expiryStatus(mover.license_expires_at)?.label}
                </p>
              )}
              <DocumentUploader
                url={licenseDocUrl}
                onChange={setLicenseDocUrl}
                label="License photo"
              />
            </div>

            <div className="space-y-1.5 border-t border-border pt-4">
              <Label>Insurance expiration</Label>
              <Input
                type="date"
                value={insuranceExpires}
                onChange={(e) => setInsuranceExpires(e.target.value)}
                className="h-11 rounded-xl"
              />
              {expiryStatus(mover.insurance_expires_at) && (
                <p
                  className={cn(
                    "text-xs",
                    expiryStatus(mover.insurance_expires_at)?.tone === "bad" && "text-destructive",
                    expiryStatus(mover.insurance_expires_at)?.tone === "warn" &&
                      "text-accent-foreground",
                    expiryStatus(mover.insurance_expires_at)?.tone === "ok" &&
                      "text-muted-foreground",
                  )}
                >
                  {expiryStatus(mover.insurance_expires_at)?.label}
                </p>
              )}
              <DocumentUploader
                url={insuranceDocUrl}
                onChange={setInsuranceDocUrl}
                label="Insurance certificate"
              />
            </div>

            <Button
              className="w-full rounded-xl"
              disabled={savingCompliance}
              onClick={() => void saveCompliance()}
            >
              {savingCompliance ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save documents"}
            </Button>
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
