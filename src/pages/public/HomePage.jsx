import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ROUTE_PATHS } from "../../app/routes";
import { useAuth } from "../../auth/AuthProvider";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { apiClient } from "../../lib/apiClient";

export function HomePage() {
  const { loading, isAuthenticated, hasActiveSubscription } = useAuth();
  const [featuredCharity, setFeaturedCharity] = useState(null);

  const primaryAction = !loading && isAuthenticated && hasActiveSubscription
    ? { to: "/dashboard", label: "Go to Dashboard" }
    : { to: ROUTE_PATHS.public.subscribe, label: "Start Subscription" };

  const secondaryAction = !loading && isAuthenticated
    ? { to: ROUTE_PATHS.public.charities, label: "Manage Charity Preference" }
    : { to: ROUTE_PATHS.public.drawMechanics, label: "See Draw Mechanics" };

  useEffect(() => {
    let active = true;
    apiClient
      .getFeaturedCharity()
      .then((result) => {
        if (active) {
          setFeaturedCharity(result.charity || null);
        }
      })
      .catch(() => {
        if (active) {
          setFeaturedCharity(null);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="space-y-8 md:space-y-10">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-surface-200/70 p-6 md:p-10">
        <div className="pointer-events-none absolute -right-24 -top-20 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl" aria-hidden="true" />
        <PageHeader
          eyebrow="Golf Charity Subscription Platform"
          title="Play, participate, and contribute with every subscription."
          description="The platform combines golf performance tracking, monthly draw participation, and a charity contribution path in one subscription experience."
        />
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to={primaryAction.to}>
            <Button aria-label="Primary account action">{primaryAction.label}</Button>
          </Link>
          <Link to={secondaryAction.to}>
            <Button variant="secondary">{secondaryAction.label}</Button>
          </Link>
          <Link to={ROUTE_PATHS.public.charities}>
            <Button variant="secondary">Explore Charities</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3" aria-label="Platform overview cards">
        <Card
          title="What the Platform Does"
          description="Subscribers enter Stableford scores, participate in monthly draws, and manage charity contribution preferences."
        />
        <Card
          title="How Users Win"
          description="Monthly draw tiers include 5-number, 4-number, and 3-number matches with admin-controlled result publishing."
        />
        <Card
          title="Charity Impact First"
          description="At signup, users choose a charity and contribute at least 10% of subscription fee, with optional increase."
        />
      </div>

      <Card
        title={!loading && isAuthenticated ? "Member Shortcuts" : "Public Visitor Path"}
        description={
          !loading && isAuthenticated
            ? "Jump into dashboard actions, profile setup, and draw participation details."
            : "Understand the concept, review draw mechanics, explore charities, then start subscription."
        }
      >
        <div className="flex flex-wrap gap-3">
          <Link to={!loading && isAuthenticated ? "/dashboard" : ROUTE_PATHS.public.drawMechanics}>
            <Button variant="ghost">{!loading && isAuthenticated ? "Dashboard Overview" : "Draw Mechanics"}</Button>
          </Link>
          <Link to={ROUTE_PATHS.public.charities}>
            <Button variant="ghost">{!loading && isAuthenticated ? "Charity Preferences" : "Charity Directory"}</Button>
          </Link>
          <Link to={primaryAction.to}>
            <Button>{primaryAction.label}</Button>
          </Link>
        </div>
      </Card>

      <Card title="Featured Charity Spotlight" description="PRD-required homepage spotlight section.">
        {featuredCharity ? (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-50">{featuredCharity.name}</h3>
            <p className="text-sm text-slate-300">{featuredCharity.description}</p>
            <Link to={`/charities/${featuredCharity.id}`}>
              <Button variant="secondary">View Charity Profile</Button>
            </Link>
          </div>
        ) : (
          <p className="text-sm text-slate-300">Placeholder: featured charity record will appear when configured.</p>
        )}
      </Card>

      <p className="text-xs text-slate-300">
        Note: Content blocks are PRD-aligned. Copy and campaign content not defined in PRD are represented with neutral placeholder phrasing.
      </p>
    </section>
  );
}