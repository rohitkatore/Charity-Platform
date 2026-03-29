import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { AuthForm } from "../../components/auth/AuthForm";
import { Button } from "../../components/ui/Button";
import { getSupabaseClient } from "../../lib/supabaseClient";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export function AuthLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setServerError("");
    setErrors({});

    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });

      if (error) {
        setServerError(error.message || "Invalid credentials.");
        return;
      }

      navigate("/dashboard", { replace: true });
    } catch (error) {
      setServerError(error.message || "Unable to login. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthForm title="Login" description="Sign in to continue to your dashboard.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <label className="block text-sm text-slate-200" htmlFor="auth-login-email">
          Email
          <input
            id="auth-login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-slate-100"
          />
          {errors.email?.[0] ? <span className="mt-1 block text-xs text-red-300">{errors.email[0]}</span> : null}
        </label>

        <label className="block text-sm text-slate-200" htmlFor="auth-login-password">
          Password
          <input
            id="auth-login-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-slate-100"
          />
          {errors.password?.[0] ? <span className="mt-1 block text-xs text-red-300">{errors.password[0]}</span> : null}
        </label>

        {serverError ? <p className="text-sm text-red-300">{serverError}</p> : null}

        <Button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </Button>

        <div className="flex items-center justify-between text-sm">
          <Link to="/auth/forgot-password" className="text-brand-200 underline">
            Forgot password?
          </Link>
          <Link to="/auth/signup" className="text-brand-200 underline">
            Create account
          </Link>
        </div>
      </form>
    </AuthForm>
  );
}
