import { useEffect, useState } from "react";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { apiClient } from "../../lib/apiClient";

export function AdminReportsPage() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    apiClient
      .getAdminReports()
      .then((result) => {
        if (active) {
          setReport(result.report || null);
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
        eyebrow="Admin"
        title="Reports and Analytics"
        description="Total users, total prize pool, charity contribution totals, and draw statistics."
      />

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Total Users">
          <p className="text-2xl font-semibold text-slate-100">{report?.totalUsers ?? 0}</p>
        </Card>
        <Card title="Total Prize Pool">
          <p className="text-2xl font-semibold text-slate-100">{report?.totalPrizePool ?? 0}</p>
        </Card>
        <Card title="Total Draws">
          <p className="text-2xl font-semibold text-slate-100">{report?.drawStatistics?.totalDraws ?? 0}</p>
        </Card>
        <Card title="Total Winners">
          <p className="text-2xl font-semibold text-slate-100">{report?.drawStatistics?.totalWinners ?? 0}</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Charity Contribution Totals">
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-left text-sm text-slate-300">
              <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-200">
                <tr>
                  <th className="px-3 py-2">Charity</th>
                  <th className="px-3 py-2">Total Contribution</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(report?.charityContributionTotals || {}).map(([name, value]) => (
                  <tr key={name} className="border-t border-white/10">
                    <td className="px-3 py-2">{name}</td>
                    <td className="px-3 py-2">{value}</td>
                  </tr>
                ))}
                {Object.keys(report?.charityContributionTotals || {}).length === 0 ? (
                  <tr>
                    <td className="px-3 py-3" colSpan={2}>No recorded contributions.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Draw Statistics">
          <ul className="space-y-2 text-sm text-slate-300">
            <li>Total participants: {report?.drawStatistics?.totalParticipants ?? 0}</li>
            <li>Current rollover balance: {report?.drawStatistics?.rolloverBalanceCurrent ?? 0}</li>
          </ul>
        </Card>
      </div>
    </section>
  );
}