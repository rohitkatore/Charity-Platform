import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ROUTE_PATHS } from "../../app/routes";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { useAuth } from "../../auth/AuthProvider";
import { apiClient } from "../../lib/apiClient";

function formatPrice(amount, currency) {
  if (amount === null || amount === undefined) return null;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "gbp",
    }).format(amount);
  } catch {
    return `£${amount}`;
  }
}

// Hardcoded fallback pricing that matches server constants — always available.
const FALLBACK_PLANS = [
  { id: "monthly", title: "Monthly Plan", price: "£9.99", period: "per month", highlight: null },
  { id: "yearly", title: "Yearly Plan", price: "£99.99", period: "per year", highlight: "Best value" },
];

export function SubscribePage() {
  const navigate = useNavigate();
  const { isAuthenticated, subscription } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState("");
  const [error, setError] = useState("");
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    let active = true;
    apiClient
      .getPlans()
      .then((result) => {
        if (!active) return;
        const fetched = result.plans || [];
        setPlans(
          fetched.map((plan) => ({
            id: plan.id,
            title: plan.id === "monthly" ? "Monthly Plan" : "Yearly Plan",
            price: formatPrice(plan.amount, plan.currency) || (plan.id === "yearly" ? "£99.99" : "£9.99"),
            period: plan.cycle === "yearly" ? "per year" : "per month",
            highlight: plan.discounted ? "Best value" : null,
          }))
        );
      })
      .catch(() => {
        if (!active) return;
        setPlans(FALLBACK_PLANS);
      })
      .finally(() => {
        if (active) setLoadingPlans(false);
      });
    return () => { active = false; };
  }, []);

  const activeMessage =
    subscription?.status === "active"
      ? "Your subscription is active. You can continue to the dashboard."
      : "Your account is signed in, but no active subscription is currently detected.";

  async function handleStart(planId) {
    if (!isAuthenticated) {
      navigate(`${ROUTE_PATHS.public.login}?redirect=${encodeURIComponent(ROUTE_PATHS.public.subscribe)}`, { replace: true });
      return;
    }

    setLoadingPlan(planId);
    setError("");
    try {
      const result = await apiClient.createStripeCheckoutSession({ plan: planId });
      if (!result?.checkoutUrl) {
        throw new Error("Unable to create Stripe checkout session.");
      }

      window.location.assign(result.checkoutUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPlan("");
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Subscription"
        title="Start Your Subscription"
        description="Choose monthly or yearly plan and continue to secure Stripe checkout."
      />

      <Card
        title="Included Features"
        description="Every active plan includes score entry, draw participation, and charity contribution."
      >
        <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-300">
          <li>Track golf scores using Stableford entries.</li>
          <li>Participate in monthly draw cycles.</li>
          <li>Contribute a portion of subscription to your selected charity.</li>
        </ol>
      </Card>

      {loadingPlans ? (
        <p className="text-sm text-slate-300">Loading pricing...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((plan) => (
            <Card key={plan.id} title={plan.title}>
              {plan.highlight ? (
                <p className="mb-2 inline-flex rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-200">
                  {plan.highlight}
                </p>
              ) : null}
              <p className="text-2xl font-semibold text-slate-100">
                {plan.price} <span className="text-sm font-normal text-slate-300">{plan.period}</span>
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-300">
                <li>Score entry</li>
                <li>Draw participation</li>
                <li>Charity contribution</li>
              </ul>
              <div className="mt-4">
                <Button onClick={() => handleStart(plan.id)} disabled={loadingPlan.length > 0}>
                  {loadingPlan === plan.id ? "Redirecting..." : "Subscribe"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {isAuthenticated ? (
        <Card title="Current Session">
          <p className="text-sm text-slate-300">{activeMessage}</p>
          <div className="mt-4">
            <Link to="/dashboard">
              <Button variant="secondary">Go to Dashboard</Button>
            </Link>
          </div>
        </Card>
      ) : null}

      <Card title="Already Have an Account?">
        <p className="text-sm text-slate-300">Continue via login to start your checkout session.</p>
        <div className="mt-4">
          <Link to={ROUTE_PATHS.public.login}>
            <Button variant="secondary">Login</Button>
          </Link>
        </div>
      </Card>
    </section>
  );
}
