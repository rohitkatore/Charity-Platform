import { getSupabaseClient } from "../lib/supabaseClient";

export async function signOut({ navigate, redirectTo = "/auth/login" } = {}) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }

  if (typeof navigate === "function") {
    navigate(redirectTo, { replace: true });
  }
}
