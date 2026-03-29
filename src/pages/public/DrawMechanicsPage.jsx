import { Link } from "react-router-dom";
import { ROUTE_PATHS } from "../../app/routes";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";

export function DrawMechanicsPage() {
  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Draw Mechanics"
        title="How Monthly Draw Participation Works"
        description="Draws are executed monthly with 5-number, 4-number, and 3-number match tiers and admin-controlled publishing."
      />

      <Card title="Prize Pool Distribution">
        <p className="mb-4 text-sm text-slate-300">
          A fixed portion of each subscription contributes to the prize pool. Distribution is pre-defined and enforced automatically.
        </p>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-200">
              <tr>
                <th className="px-4 py-3">Match Type</th>
                <th className="px-4 py-3">Pool Share</th>
                <th className="px-4 py-3">Rollover?</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-t border-white/10">
                <td className="px-4 py-3 font-semibold text-brand-300">5-Number Match</td>
                <td className="px-4 py-3 font-semibold text-slate-50">40%</td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-200">Yes (Jackpot)</span>
                </td>
              </tr>
              <tr className="border-t border-white/10">
                <td className="px-4 py-3 font-semibold text-brand-300">4-Number Match</td>
                <td className="px-4 py-3 font-semibold text-slate-50">35%</td>
                <td className="px-4 py-3 text-slate-400">No</td>
              </tr>
              <tr className="border-t border-white/10">
                <td className="px-4 py-3 font-semibold text-brand-300">3-Number Match</td>
                <td className="px-4 py-3 font-semibold text-slate-50">25%</td>
                <td className="px-4 py-3 text-slate-400">No</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-300">
          <li>Auto-calculation of each pool tier based on active subscriber count.</li>
          <li>Prizes split equally among multiple winners in the same tier.</li>
          <li>5-Match jackpot carries forward if unclaimed.</li>
        </ul>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="5-Number Match" description="Top tier — receives 40% of the prize pool with jackpot rollover to next month if unclaimed." />
        <Card title="4-Number Match" description="Second tier — receives 35% of the prize pool. Distributed among all 4-match winners equally." />
        <Card title="3-Number Match" description="Third tier — receives 25% of the prize pool. Distributed among all 3-match winners equally." />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Draw Logic Modes">
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-300">
            <li><span className="font-semibold text-slate-100">Random generation</span> — standard lottery-style draw where 5 numbers are selected at random from the 1–45 range.</li>
            <li><span className="font-semibold text-slate-100">Algorithmic mode</span> — weighted by most or least frequent user scores across all subscribers for strategic variation.</li>
          </ul>
        </Card>

        <Card title="Operational Notes">
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-300">
            <li>Draw cadence is monthly.</li>
            <li>Simulation and pre-analysis mode exists before official publish.</li>
            <li>Admins publish official results.</li>
            <li>Each subscriber's 5 latest scores become their draw entry numbers.</li>
          </ul>
        </Card>
      </div>

      <Card title="How Your Scores Become Draw Numbers">
        <div className="space-y-3 text-sm text-slate-300">
          <p>Your 5 most recent Stableford scores (1–45) serve as your draw entry numbers each month.</p>
          <div className="grid gap-2 md:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-surface-300/50 p-3 text-center">
              <p className="text-xs uppercase tracking-wide text-brand-300">Step 1</p>
              <p className="mt-1 font-semibold text-slate-100">Enter Scores</p>
              <p className="mt-1 text-xs">Log your last 5 golf scores in Stableford format.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-surface-300/50 p-3 text-center">
              <p className="text-xs uppercase tracking-wide text-brand-300">Step 2</p>
              <p className="mt-1 font-semibold text-slate-100">Monthly Draw</p>
              <p className="mt-1 text-xs">Admin runs the draw (random or algorithmic).</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-surface-300/50 p-3 text-center">
              <p className="text-xs uppercase tracking-wide text-brand-300">Step 3</p>
              <p className="mt-1 font-semibold text-slate-100">Match Numbers</p>
              <p className="mt-1 text-xs">Your scores are compared against drawn numbers.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-surface-300/50 p-3 text-center">
              <p className="text-xs uppercase tracking-wide text-brand-300">Step 4</p>
              <p className="mt-1 font-semibold text-slate-100">Win Prizes</p>
              <p className="mt-1 text-xs">3+ matches wins from the tiered prize pool.</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="rounded-2xl border border-brand-500/40 bg-brand-600/10 p-5">
        <h2 className="text-lg font-semibold text-slate-50">Ready to Participate?</h2>
        <p className="mt-2 text-sm text-slate-200">
          Start your subscription to enter the platform and participate in monthly draws.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to={ROUTE_PATHS.public.subscribe}>
            <Button>Start Subscription</Button>
          </Link>
          <Link to={ROUTE_PATHS.public.charities}>
            <Button variant="secondary">View Charities</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}