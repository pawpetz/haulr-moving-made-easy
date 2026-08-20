import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "customer" | "mover" | "admin";

interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  primaryRole: AppRole;
  activeRole: AppRole;
  setActiveRole: (role: AppRole) => void;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function activeRoleKey(userId: string) {
  return `haulr:active_role:${userId}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRoleOverride, setActiveRoleOverride] = useState<AppRole | null>(null);

  const loadUserData = async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      setRoles([]);
      return;
    }
    const [{ data: profileData }, { data: roleData }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email, phone, address, avatar_url")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    setProfile(profileData ?? null);
    setRoles(((roleData ?? []) as { role: AppRole }[]).map((r) => r.role));
  };

  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setTimeout(() => {
        void loadUserData(nextSession?.user?.id);
      }, 0);
    });

    void supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await loadUserData(data.session?.user?.id);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !session?.user?.id) {
      setActiveRoleOverride(null);
      return;
    }
    try {
      const stored = window.localStorage.getItem(activeRoleKey(session.user.id)) as AppRole | null;
      setActiveRoleOverride(stored && roles.includes(stored) ? stored : null);
    } catch {
      setActiveRoleOverride(null);
    }
  }, [session?.user?.id, roles]);

  const value = useMemo<AuthContextValue>(() => {
    const primaryRole: AppRole = roles.includes("admin")
      ? "admin"
      : roles.includes("mover")
        ? "mover"
        : "customer";
    const activeRole = activeRoleOverride ?? primaryRole;
    return {
      user: session?.user ?? null,
      session,
      profile,
      roles,
      primaryRole,
      activeRole,
      setActiveRole: (role: AppRole) => {
        if (!session?.user?.id || !roles.includes(role)) return;
        setActiveRoleOverride(role);
        try {
          window.localStorage.setItem(activeRoleKey(session.user.id), role);
        } catch {
          // ignore storage failures (private browsing, etc.)
        }
      },
      loading,
      refresh: async () => loadUserData(session?.user?.id),
      signOut: async () => {
        await supabase.auth.signOut();
        setProfile(null);
        setRoles([]);
        setActiveRoleOverride(null);
      },
    };
  }, [session, profile, roles, loading, activeRoleOverride]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
