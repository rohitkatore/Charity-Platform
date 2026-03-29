import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getSupabaseClient } from "../../lib/supabaseClient";

export function ProtectedRoute({ children, requireActiveSubscription = false }) {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const supabase = getSupabaseClient();
        const result = await supabase.auth.getSession();
        const currentSession = result.data?.session || null;
        let currentProfile = null;

        if (currentSession?.user?.id) {
          const profileResult = await supabase
            .from("profiles")
            .select("id, role, subscription_status")
            .eq("id", currentSession.user.id)
            .single();

          if (!profileResult.error) {
            currentProfile = profileResult.data;
          }
        }

        if (mounted) {
          setSession(currentSession);
          setProfile(currentProfile);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-300">Checking access...</p>;
  }

  if (!session) {
    return <Navigate to={`/auth/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (requireActiveSubscription && profile?.subscription_status !== "active") {
    return <Navigate to="/subscribe" replace />;
  }

  return children;
}
