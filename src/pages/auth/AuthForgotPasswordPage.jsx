import { useState } from "react";
import { z } from "zod";
import { AuthForm } from "../../components/auth/AuthForm";
import { Button } from "../../components/ui/Button";
import { getSupabaseClient } from "../../lib/supabaseClient";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

export function AuthForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setErrors({});
    setServerError("");
    setSuccess("");

    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
      });

      if (error) {
        setServerError(error.message || "Unable to submit reset request.");
        return;
      }

      setSuccess("If the email exists, a reset link has been sent.");
    } catch (error) {
      setServerError(error.message || "Unable to submit reset request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthForm title="Forgot Password" description="Enter your email to receive a password reset link.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <label className="block text-sm text-slate-200" htmlFor="auth-forgot-email">
          Email
          <input
            id="auth-forgot-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-slate-100"
          />
          {errors.email?.[0] ? <span className="mt-1 block text-xs text-red-300">{errors.email[0]}</span> : null}
        </label>

        {serverError ? <p className="text-sm text-red-300">{serverError}</p> : null}
        {success ? <p className="text-sm text-emerald-300">{success}</p> : null}

        <Button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send reset link"}
        </Button>
      </form>
    </AuthForm>
  );
}
