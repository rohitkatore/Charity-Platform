import { useEffect, useState } from "react";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { apiClient } from "../../lib/apiClient";

export function SubscriberParticipationPage() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    apiClient
      .getSubscriberParticipationSummary()
      .then((result) => {
        if (active) {
          setSummary(result.summary || null);
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

  return (
    <section className="space-y-5">
      <PageHeader
        eyebrow="Subscriber"
        title="Participation Summary"
        description="Track entered draws and upcoming draw schedule."
      />

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Draws Entered">
          <p className="text-2xl font-semibold text-slate-100">{summary?.drawsEntered ?? 0}</p>
          <p className="mt-2 text-sm text-slate-300">
            {summary?.enteredMonths?.length ? summary.enteredMonths.join(", ") : "No published draw participation yet."}
          </p>
        </Card>

        <Card title="Upcoming Draws">
          <ul className="space-y-2 text-sm text-slate-300">
            {(summary?.upcomingDraws || []).map((item) => (
              <li key={item.drawMonth} className="rounded-lg border border-white/10 px-3 py-2">
                <p>Month: {item.drawMonth}</p>
                <p>Status: {item.status}</p>
              </li>
            ))}
            {!summary?.upcomingDraws?.length ? <li>No upcoming draw schedule available.</li> : null}
          </ul>
        </Card>
      </div>
    </section>
  );
}