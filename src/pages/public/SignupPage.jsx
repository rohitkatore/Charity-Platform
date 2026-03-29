import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ROUTE_PATHS } from "../../app/routes";
import { useAuth } from "../../auth/AuthProvider";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { apiClient } from "../../lib/apiClient";

function getPasswordStrength(password) {
  if (!password) return { label: "", color: "", width: "0%" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { label: "Weak", color: "bg-red-400", width: "20%" };
  if (score === 2) return { label: "Fair", color: "bg-orange-400", width: "40%" };
  if (score === 3) return { label: "Good", color: "bg-yellow-400", width: "60%" };
  if (score === 4) return { label: "Strong", color: "bg-emerald-400", width: "80%" };
  return { label: "Very Strong", color: "bg-emerald-500", width: "100%" };
}

export function SignupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signup, refreshSession } = useAuth();
  const initialPlan = new URLSearchParams(location.search).get("plan") || "monthly";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [planId, setPlanId] = useState(initialPlan === "yearly" ? "yearly" : "monthly");
  const [charities, setCharities] = useState([]);
  const [charityId, setCharityId] = useState("");
  const [contributionPercentage, setContributionPercentage] = useState("10");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordStrength = getPasswordStrength(password);

  useEffect(() => {
    let active = true;
    apiClient
      .getCharities()
      .then((result) => {
        if (!active) {
          return;
        }
        const list = result.charities || [];
        setCharities(list);
        if (list.length > 0) {
          setCharityId(list[0].id);
        }
      })
      .catch(() => {
        if (active) {
          setCharities([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!charityId) {
      setError("Please select a charity.");
      return;
    }

    if (Number(contributionPercentage) < 10) {
      setError("Contribution percentage must be at least 10%.");
      return;
    }

    setLoading(true);
    try {
      await signup({
        email,
        password,
        charityId,
        contributionPercentage: Number(contributionPercentage),
      });
      await apiClient.startSubscription({ planId });
      await refreshSession();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-5">
      <PageHeader
        eyebrow="Access"
        title="Create Account"
        description="Create your account and choose monthly or yearly plan to start subscription access."
      />

      <Card title="Signup">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <label className="block text-sm text-slate-200" htmlFor="signup-email">
            Email
            <input
              id="signup-email"
              type="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-slate-100"
            />
          </label>

          <label className="block text-sm text-slate-200" htmlFor="signup-password">
            Password
            <input
              id="signup-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-slate-100"
            />
            {password.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="h-1.5 w-full rounded-full bg-white/10">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ width: passwordStrength.width }}
                  />
                </div>
                <p className={`text-xs ${password.length < 8 ? "text-red-300" : "text-slate-400"}`}>
                  {password.length < 8
                    ? `${8 - password.length} more character${8 - password.length > 1 ? "s" : ""} needed`
                    : `Strength: ${passwordStrength.label}`}
                </p>
              </div>
            )}
          </label>

          <label className="block text-sm text-slate-200" htmlFor="signup-confirm-password">
            Confirm Password
            <input
              id="signup-confirm-password"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-slate-100"
            />
          </label>

          <fieldset className="space-y-2">
            <legend className="text-sm text-slate-200">Plan</legend>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="radio" name="plan" checked={planId === "monthly"} onChange={() => setPlanId("monthly")} />
              Monthly
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="radio" name="plan" checked={planId === "yearly"} onChange={() => setPlanId("yearly")} />
              Yearly (discounted)
            </label>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm text-slate-200">Charity Selection</legend>
            <label className="block text-sm text-slate-200" htmlFor="signup-charity">
              Choose charity
              <select
                id="signup-charity"
                required
                value={charityId}
                onChange={(event) => setCharityId(event.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-slate-100"
              >
                {charities.map((charity) => (
                  <option key={charity.id} value={charity.id}>
                    {charity.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-slate-200" htmlFor="signup-contribution">
              Charity contribution percentage (minimum 10%)
              <input
                id="signup-contribution"
                type="number"
                min="10"
                step="0.1"
                required
                value={contributionPercentage}
                onChange={(event) => setContributionPercentage(event.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-slate-100"
              />
            </label>
          </fieldset>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          <Button type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create Account & Start Subscription"}
          </Button>
        </form>
      </Card>

      <p className="text-sm text-slate-300">
        Already have an account?{" "}
        <Link to={ROUTE_PATHS.public.login} className="text-brand-200 underline">
          Login
        </Link>
      </p>
    </section>
  );
}