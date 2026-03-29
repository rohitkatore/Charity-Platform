import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ROUTE_PATHS } from "../../app/routes";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { apiClient } from "../../lib/apiClient";

export function CharitiesPage() {
  const [search, setSearch] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("all");
  const [charities, setCharities] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    apiClient
      .getCharities({ search, featured: featuredFilter })
      .then((result) => {
        if (active) {
          setCharities(result.charities || []);
          setError("");
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message);
        }
      });

    return () => {
      active = false;
    };
  }, [search, featuredFilter]);

  const featuredCharity = useMemo(() => charities.find((item) => item.isFeatured) || null, [charities]);

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Charities"
        title="Charity Directory"
        description="Browse listed charities, search by name/description, and filter by spotlight status."
      />

      <Card title="Directory Controls">
        <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
          <label className="text-sm text-slate-200" htmlFor="charity-search">
            Search charities
            <input
              id="charity-search"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or description"
              className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400"
            />
          </label>
          <label className="text-sm text-slate-200" htmlFor="charity-filter-featured">
            Spotlight filter
            <select
              id="charity-filter-featured"
              value={featuredFilter}
              onChange={(event) => setFeaturedFilter(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-sm text-slate-100"
            >
              <option value="all">All</option>
              <option value="featured">Featured only</option>
              <option value="non-featured">Non-featured only</option>
            </select>
          </label>
        </div>
      </Card>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card
          title="Featured / Spotlight Charity"
          description="Homepage spotlight is sourced from charities flagged as featured."
        >
          {featuredCharity ? (
            <>
              <p className="text-sm text-slate-300">{featuredCharity.name}</p>
              <div className="mt-4">
                <Link to={`/charities/${featuredCharity.id}`}>
                  <Button variant="secondary">View Charity Profile</Button>
                </Link>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-300">No featured charity found for current filters.</p>
          )}
        </Card>

        <Card title="Charity List">
          {charities.length === 0 ? (
            <p className="text-sm text-slate-300">No charities match your current search/filter.</p>
          ) : (
            <ul className="space-y-3 text-sm text-slate-300">
              {charities.map((charity) => (
                <li key={charity.id} className="rounded-xl border border-white/10 p-3">
                  <p className="font-semibold text-slate-100">{charity.name}</p>
                  <p className="mt-1 text-xs text-slate-300">{charity.description}</p>
                  <div className="mt-3">
                    <Link to={`/charities/${charity.id}`}>
                      <Button variant="ghost">Open Profile</Button>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="rounded-2xl border border-brand-500/40 bg-brand-600/10 p-5">
        <h2 className="text-lg font-semibold text-slate-50">Start Your Subscription</h2>
        <p className="mt-2 text-sm text-slate-200">
          Choose a plan, pick a charity at signup, and enter monthly participation flow.
        </p>
        <div className="mt-4">
          <Link to={ROUTE_PATHS.public.subscribe}>
            <Button>Continue to Subscribe</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}