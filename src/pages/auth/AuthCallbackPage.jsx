import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthForm } from "../../components/auth/AuthForm";
import { getSupabaseClient } from "../../lib/supabaseClient";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function exchange() {
      try {
        const supabase = getSupabaseClient();
        const code = searchParams.get("code");
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            throw exchangeError;
          }
        }

        const nextPath = searchParams.get("next") || "/dashboard";
        if (active) {
          navigate(nextPath, { replace: true });
        }
      } catch (nextError) {
        if (active) {
          setError(nextError.message || "Authentication callback failed.");
        }
      }
    }

    exchange();

    return () => {
      active = false;
    };
  }, [navigate, searchParams]);

  return (
    <AuthForm title="Completing Sign-in" description="Please wait while we complete your authentication.">
      {error ? (
        <div className="space-y-3">
          <p className="text-sm text-red-300">{error}</p>
          <Link to="/auth/login" className="text-sm text-brand-200 underline">
            Return to login
          </Link>
        </div>
      ) : (
        <p className="text-sm text-slate-300">Processing callback...</p>
      )}
    </AuthForm>
  );
}
