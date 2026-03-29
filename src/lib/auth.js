import { getSupabaseClient } from "./supabaseClient";

export async function getServerSession(request) {
  void request;
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    return null;
  }

  return data.session || null;
}

export async function getUser(request) {
  void request;
  const supabase = getSupabaseClient();
  const session = await getServerSession();
  if (!session?.user?.id) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function isAdmin(request) {
  const profile = await getUser(request);
  return profile?.role === "admin";
}
