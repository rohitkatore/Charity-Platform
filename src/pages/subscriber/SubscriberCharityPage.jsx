import { useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { apiClient } from "../../lib/apiClient";

export function SubscriberCharityPage() {
  const [charities, setCharities] = useState([]);
  const [charityId, setCharityId] = useState("");
  const [contributionPercentage, setContributionPercentage] = useState("10");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all([apiClient.getCharities(), apiClient.getSubscriberCharityPreference()])
      .then(([charityResult, preferenceResult]) => {
        if (!active) {
          return;
        }
        const list = charityResult.charities || [];
        setCharities(list);
        const pref = preferenceResult.preference;
        if (pref) {
          setCharityId(pref.charityId);
          setContributionPercentage(String(pref.contributionPercentage));
        } else if (list.length > 0) {
          setCharityId(list[0].id);
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
  }, []);

  async function handleSave(event) {
    event.preventDefault();
    setError("");
    setMessage("");

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
      await apiClient.updateSubscriberCharityPreference({
        charityId,
        contributionPercentage: Number(contributionPercentage),
      });
      setMessage("Charity preference updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-5">
      <PageHeader
        eyebrow="Subscriber"
        title="Charity Preference"
        description="Manage your selected charity and contribution percentage. Minimum is 10% as required by the PRD."
      />

      <Card title="Update Preference">
        <form onSubmit={handleSave} className="space-y-4" noValidate>
          <label className="block text-sm text-slate-200" htmlFor="dashboard-charity-select">
            Charity
            <select
              id="dashboard-charity-select"
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

          <label className="block text-sm text-slate-200" htmlFor="dashboard-charity-percentage">
            Contribution Percentage (minimum 10%)
            <input
              id="dashboard-charity-percentage"
              type="number"
              min="10"
              step="0.1"
              value={contributionPercentage}
              onChange={(event) => setContributionPercentage(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-slate-100"
            />
          </label>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          {message ? <p className="text-sm text-slate-300">{message}</p> : null}

          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Charity Preference"}
          </Button>
        </form>
      </Card>
    </section>
  );
}