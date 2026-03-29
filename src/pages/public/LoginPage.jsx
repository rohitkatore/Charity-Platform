import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ROUTE_PATHS } from "../../app/routes";
import { useAuth } from "../../auth/AuthProvider";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, hasActiveSubscription } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const redirect = new URLSearchParams(location.search).get("redirect");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const session = await login({ email, password });
      if (redirect) {
        navigate(redirect, { replace: true });
        return;
      }

      if (session.user?.role === "admin") {
        navigate("/admin", { replace: true });
        return;
      }

      if (session.subscription?.status === "active" || hasActiveSubscription) {
        navigate("/dashboard", { replace: true });
        return;
      }

      navigate(ROUTE_PATHS.public.subscribe, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-5">
      <PageHeader eyebrow="Access" title="Login" description="Access your account to continue subscription and platform features." />

      <Card title="Login">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <label className="block text-sm text-slate-200" htmlFor="login-email">
            Email
            <input
              id="login-email"
              type="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-slate-100"
            />
          </label>

          <label className="block text-sm text-slate-200" htmlFor="login-password">
            Password
            <input
              id="login-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-slate-100"
            />
          </label>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          <Button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </Card>

      <p className="text-sm text-slate-300">
        New to the platform?{" "}
        <Link to={ROUTE_PATHS.public.signup} className="text-brand-200 underline">
          Create an account
        </Link>
      </p>
    </section>
  );
}