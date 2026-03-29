import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { AuthForm } from "../../components/auth/AuthForm";
import { Button } from "../../components/ui/Button";
import { getSupabaseClient } from "../../lib/supabaseClient";

const schema = z
  .object({
    fullName: z.string().trim().min(1, "Full name is required."),
    email: z.string().trim().email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm password is required."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Confirm password must match password.",
    path: ["confirmPassword"],
  });

export function AuthSignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setServerError("");
    setErrors({});

    const parsed = schema.safeParse({ fullName, email, password, confirmPassword });
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          data: {
            full_name: parsed.data.fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setServerError(error.message || "Unable to create account.");
        return;
      }

      navigate(`/signup/confirm?email=${encodeURIComponent(parsed.data.email)}`, { replace: true });
    } catch (error) {
      setServerError(error.message || "Unable to create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthForm title="Create Account" description="Create your account and verify your email to continue.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <label className="block text-sm text-slate-200" htmlFor="auth-signup-name">
          Full Name
          <input
            id="auth-signup-name"
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-slate-100"
          />
          {errors.fullName?.[0] ? <span className="mt-1 block text-xs text-red-300">{errors.fullName[0]}</span> : null}
        </label>

        <label className="block text-sm text-slate-200" htmlFor="auth-signup-email">
          Email
          <input
            id="auth-signup-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-slate-100"
          />
          {errors.email?.[0] ? <span className="mt-1 block text-xs text-red-300">{errors.email[0]}</span> : null}
        </label>

        <label className="block text-sm text-slate-200" htmlFor="auth-signup-password">
          Password
          <input
            id="auth-signup-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-slate-100"
          />
          {errors.password?.[0] ? <span className="mt-1 block text-xs text-red-300">{errors.password[0]}</span> : null}
        </label>

        <label className="block text-sm text-slate-200" htmlFor="auth-signup-confirm-password">
          Confirm Password
          <input
            id="auth-signup-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-slate-100"
          />
          {errors.confirmPassword?.[0] ? (
            <span className="mt-1 block text-xs text-red-300">{errors.confirmPassword[0]}</span>
          ) : null}
        </label>

        {serverError ? <p className="text-sm text-red-300">{serverError}</p> : null}

        <Button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </Button>

        <p className="text-sm text-slate-300">
          Already have an account? <Link to="/auth/login" className="text-brand-200 underline">Login</Link>
        </p>
      </form>
    </AuthForm>
  );
}
