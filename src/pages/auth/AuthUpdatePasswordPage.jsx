import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { AuthForm } from "../../components/auth/AuthForm";
import { Button } from "../../components/ui/Button";
import { getSupabaseClient } from "../../lib/supabaseClient";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm password is required."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Confirm password must match password.",
    path: ["confirmPassword"],
  });

export function AuthUpdatePasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setErrors({});
    setServerError("");
    setSuccess("");

    const parsed = schema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
      if (error) {
        setServerError(error.message || "Unable to update password.");
        return;
      }

      setSuccess("Password updated successfully. Redirecting to login...");
      setTimeout(() => {
        navigate("/auth/login", { replace: true });
      }, 800);
    } catch (error) {
      setServerError(error.message || "Unable to update password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthForm title="Update Password" description="Set your new password.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <label className="block text-sm text-slate-200" htmlFor="auth-update-password">
          New Password
          <input
            id="auth-update-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-slate-100"
          />
          {errors.password?.[0] ? <span className="mt-1 block text-xs text-red-300">{errors.password[0]}</span> : null}
        </label>

        <label className="block text-sm text-slate-200" htmlFor="auth-update-confirm-password">
          Confirm Password
          <input
            id="auth-update-confirm-password"
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
        {success ? <p className="text-sm text-emerald-300">{success}</p> : null}

        <Button type="submit" disabled={loading}>
          {loading ? "Updating..." : "Update password"}
        </Button>
      </form>
    </AuthForm>
  );
}
