const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

function createSupabaseServerClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getBearerToken(request) {
  const header = request?.headers?.authorization || request?.headers?.Authorization || "";
  if (!header.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return header.slice(7).trim() || null;
}

async function getServerSession(request) {
  const client = createSupabaseServerClient();
  const token = getBearerToken(request);
  if (!client || !token) {
    return null;
  }

  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user) {
    return null;
  }

  return {
    user: data.user,
    accessToken: token,
  };
}

async function getUser(request) {
  const client = createSupabaseServerClient();
  const session = await getServerSession(request);
  if (!client || !session?.user?.id) {
    return null;
  }

  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (error) {
    return null;
  }

  return data;
}

async function isAdmin(request) {
  const profile = await getUser(request);
  return profile?.role === "admin";
}

module.exports = {
  getServerSession,
  getUser,
  isAdmin,
};
