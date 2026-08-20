import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/haulr/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { redirect: string } => ({
    redirect: typeof search["redirect"] === "string" ? search["redirect"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Haulr" },
      { name: "description", content: "Log in or create a Haulr account to book moves or drive." },
      { property: "og:title", content: "Sign in — Haulr" },
      { property: "og:description", content: "Log in or create a Haulr account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, primaryRole, loading } = useAuth();
  const { redirect } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"customer" | "mover">("customer");

  useEffect(() => {
    if (!loading && user) {
      if (redirect) {
        void navigate({ to: redirect });
        return;
      }
      void navigate({
        to: primaryRole === "admin" ? "/admin" : primaryRole === "mover" ? "/mover" : "/dashboard",
      });
    }
  }, [loading, user, primaryRole, navigate, redirect]);

  const signIn = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back");
  };

  const signUp = async () => {
    if (!fullName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName, role },
      },
    });
    if (error) {
      setBusy(false);
      toast.error(error.message);
      return;
    }
    const userId = data.user?.id;
    if (userId) {
      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: userId,
        full_name: fullName,
        email,
        phone: phone || null,
      });
      if (profileError) {
        setBusy(false);
        toast.error(`Account created, but profile setup failed: ${profileError.message}`);
        return;
      }
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });
      if (roleError) {
        setBusy(false);
        toast.error(`Account created, but role setup failed: ${roleError.message}`);
        return;
      }
    }
    setBusy(false);
    if (!data.session) {
      toast.success("Check your email to confirm your account");
      return;
    }
    toast.success("Account created");
    void navigate({ to: role === "mover" ? "/mover-apply" : redirect || "/book" });
  };

  const resetPassword = async () => {
    if (!email) {
      toast.error("Enter your email first");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password reset email sent");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <div className="mb-8 flex flex-col items-center gap-2">
          <Logo />
          <p className="text-sm text-muted-foreground">Big stuff. Moved easy.</p>
        </div>

        <div className="surface-card p-6">
          <Tabs value={mode} onValueChange={setMode}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Log in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
              <Button
                className="h-12 w-full rounded-xl text-base"
                disabled={busy}
                onClick={() => void signIn()}
              >
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Log in
              </Button>
              <button
                type="button"
                onClick={() => void resetPassword()}
                className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                Forgot password?
              </button>
            </TabsContent>

            <TabsContent value="signup" className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {(["customer", "mover"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setRole(option)}
                    className={
                      "rounded-xl border px-3 py-3 text-sm font-semibold capitalize transition-colors " +
                      (role === option
                        ? "border-accent bg-accent/15"
                        : "border-border text-muted-foreground")
                    }
                  >
                    {option === "customer" ? "I need a move" : "I'm a mover"}
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
              <Button
                className="h-12 w-full rounded-xl text-base"
                disabled={busy}
                onClick={() => void signUp()}
              >
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create account
              </Button>
            </TabsContent>
          </Tabs>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/" className="underline-offset-4 hover:underline">
            Back to Haulr
          </Link>
        </p>
      </div>
    </div>
  );
}
