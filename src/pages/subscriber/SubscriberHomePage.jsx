import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { apiClient } from "../../lib/apiClient";

function formatDate(isoString) {
  if (!isoString) return "not set";
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return "not set";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "not set";
  }
}

export function SubscriberHomePage() {
  const { user, subscription } = useAuth();
  const [scores, setScores] = useState([]);
  const [charities, setCharities] = useState([]);
  const [charityPreference, setCharityPreference] = useState(null);
  const [participationSummary, setParticipationSummary] = useState(null);
  const [winners, setWinners] = useState([]);
  const [error, setError] = useState("");
  const [loadingOverview, setLoadingOverview] = useState(true);

  useEffect(() => {
    let active = true;

    Promise.all([
      apiClient.getSubscriberScores(),
      apiClient.getCharities(),
      apiClient.getSubscriberCharityPreference(),
      apiClient.getSubscriberParticipationSummary(),
      apiClient.getSubscriberWinners(),
    ])
      .then(([scoreResult, charitiesResult, charityResult, participationResult, winnerResult]) => {
        if (!active) {
          return;
        }

        setScores(scoreResult.scores || []);
        setCharities(charitiesResult.charities || []);
        setCharityPreference(charityResult.preference || null);
        setParticipationSummary(participationResult.summary || null);
        setWinners(winnerResult.winners || []);
      })
      .catch((err) => {
        if (active) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (active) {
          setLoadingOverview(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const totalWon = useMemo(
    () => winners.reduce((sum, item) => sum + Number(item.winningAmount || 0), 0),
    [winners]
  );

  const currentPaymentStatus = useMemo(() => {
    if (winners.length === 0) {
      return "none";
    }

    if (winners.some((item) => item.paymentState === "pending")) {
      return "pending";
    }

    return "paid";
  }, [winners]);

  const selectedCharityName = useMemo(() => {
    if (!charityPreference?.charityId) {
      return "not selected";
    }
    const selected = charities.find((item) => item.id === charityPreference.charityId);
    return selected?.name || charityPreference.charityId;
  }, [charities, charityPreference]);

  return (
    <section className="space-y-5">
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome${user?.email ? `, ${user.email}` : ""}`}
        description="Track subscription, scores, draw participation, and winnings from one place."
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <Card title="Subscription">
          <p className="text-2xl font-semibold text-slate-50 capitalize">{subscription?.status || "inactive"}</p>
          <p className="mt-1 text-xs text-slate-300">Renewal: {formatDate(subscription?.renewalDate)}</p>
        </Card>
        <Card title="Scores Logged">
          <p className="text-2xl font-semibold text-slate-50">{scores.length}</p>
          <p className="mt-1 text-xs text-slate-300">Last 5 rounds are retained automatically.</p>
        </Card>
        <Card title="Draws Entered">
          <p className="text-2xl font-semibold text-slate-50">{participationSummary?.drawsEntered ?? 0}</p>
          <p className="mt-1 text-xs text-slate-300">Monthly entries based on active subscription.</p>
        </Card>
        <Card title="Total Winnings">
          <p className="text-2xl font-semibold text-slate-50">{totalWon}</p>
          <p className="mt-1 text-xs text-slate-300">Current payout status: {currentPaymentStatus}</p>
        </Card>
      </div>

      {loadingOverview ? <p className="text-sm text-slate-300">Loading dashboard overview...</p> : null}

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Subscription Status">
          <div className="grid gap-2 text-sm text-slate-300">
            <p>Status: {subscription?.status || "inactive"}</p>
            <p>State: {subscription?.status === "active" ? "active" : "inactive"}</p>
            <p>Renewal date: {formatDate(subscription?.renewalDate)}</p>
          </div>
        </Card>

        <Card title="Selected Charity and Contribution Percentage">
          <div className="grid gap-2 text-sm text-slate-300">
            <p>Charity: {selectedCharityName}</p>
            <p>Contribution percentage: {charityPreference?.contributionPercentage ?? "not set"}</p>
          </div>
        </Card>

        <Card title="Participation Summary">
          <div className="grid gap-2 text-sm text-slate-300">
            <p>Draws entered: {participationSummary?.drawsEntered ?? 0}</p>
            <p>
              Upcoming draws: {participationSummary?.upcomingDraws?.map((item) => `${item.drawMonth} (${item.status})`).join(", ") || "none"}
            </p>
          </div>
        </Card>

        <Card title="Winnings Overview">
          <div className="grid gap-2 text-sm text-slate-300">
            <p>Total won: {totalWon}</p>
            <p>Current payment status: {currentPaymentStatus}</p>
          </div>
        </Card>
      </div>

      {/* Read-only Score Summary (replaces the duplicate full score entry widget) */}
      <Card title="Recent Scores">
        {scores.length === 0 ? (
          <p className="text-sm text-slate-300">No scores recorded yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-left text-sm text-slate-300">
              <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-200">
                <tr>
                  <th className="px-3 py-2">Score</th>
                  <th className="px-3 py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {scores.slice(0, 5).map((item) => (
                  <tr key={item.id} className="border-t border-white/10">
                    <td className="px-3 py-2">{item.scoreValue}</td>
                    <td className="px-3 py-2">{item.scoreDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3">
          <Link to="/dashboard/scores">
            <Button variant="secondary">View All Scores</Button>
          </Link>
        </div>
      </Card>

      {!loadingOverview && scores.length === 0 && !error ? (
        <Card
          title="Getting Started"
          description="Your overview will populate as you add scores and participate in draws."
        >
          <div className="grid gap-2 text-sm text-slate-300">
            <p>1. Add your first score in the Scores section.</p>
            <p>2. Confirm charity preference in the Charity section.</p>
            <p>3. Check Participation to see monthly draw entries.</p>
          </div>
          <div className="mt-4">
            <Link to="/dashboard/charity">
              <Button variant="secondary">Open Charity Settings</Button>
            </Link>
          </div>
        </Card>
      ) : null}
      
      <p className="text-xs text-slate-400">This dashboard is optimized for mobile and desktop layouts.</p>
    </section>
  );
}
