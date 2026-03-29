import { useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { apiClient } from "../../lib/apiClient";

export function AdminDrawsPage() {
  const [drawMonth, setDrawMonth] = useState("");
  const [logicMode, setLogicMode] = useState("random");
  const [algorithmWeight, setAlgorithmWeight] = useState("most-frequent");
  const [simulation, setSimulation] = useState(null);
  const [published, setPublished] = useState([]);
  const [error, setError] = useState("");

  async function loadPublished() {
    const result = await apiClient.getAdminDraws();
    setPublished(result.draws || []);
  }

  useEffect(() => {
    loadPublished().catch((err) => setError(err.message));
  }, []);

  async function runSimulation() {
    try {
      setError("");
      const result = await apiClient.simulateAdminDraw({ drawMonth, logicMode, algorithmWeight });
      setSimulation(result.draw || null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function publish() {
    try {
      setError("");
      await apiClient.publishAdminDraw({ drawMonth, logicMode, algorithmWeight });
      setSimulation(null);
      await loadPublished();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="space-y-5">
      <PageHeader
        eyebrow="Admin"
        title="Draw Management"
        description="Configure draw logic, run simulations, and publish results."
      />

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <Card title="Draw Configuration">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm text-slate-200" htmlFor="draw-month">
            Draw Month
            <input
              id="draw-month"
              placeholder="YYYY-MM"
              value={drawMonth}
              onChange={(event) => setDrawMonth(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-slate-100"
            />
          </label>
          <label className="text-sm text-slate-200" htmlFor="draw-logic-mode">
            Logic Mode
            <select
              id="draw-logic-mode"
              value={logicMode}
              onChange={(event) => setLogicMode(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-slate-100"
            >
              <option value="random">random</option>
              <option value="algorithmic">algorithmic</option>
            </select>
          </label>
          <label className="text-sm text-slate-200" htmlFor="draw-algorithm-weight">
            Algorithm Weight
            <select
              id="draw-algorithm-weight"
              value={algorithmWeight}
              onChange={(event) => setAlgorithmWeight(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-slate-100"
            >
              <option value="most-frequent">most-frequent</option>
              <option value="least-frequent">least-frequent</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={runSimulation}>Run Simulation</Button>
          <Button variant="secondary" onClick={publish}>Publish Results</Button>
        </div>
      </Card>

      <Card title="Simulation Output">
        {!simulation ? (
          <p className="text-sm text-slate-300">No simulation yet.</p>
        ) : (
          <div className="grid gap-2 text-sm text-slate-300">
            <p>Month: {simulation.drawMonth}</p>
            <p>Logic: {simulation.logicMode}</p>
            <p>Draw Numbers: {(simulation.drawNumbers || []).join(", ")}</p>
            <p>Participants: {(simulation.participants || []).length}</p>
          </div>
        )}
      </Card>

      <Card title="Published Results">
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-200">
              <tr>
                <th className="px-3 py-2">Month</th>
                <th className="px-3 py-2">Logic</th>
                <th className="px-3 py-2">Numbers</th>
                <th className="px-3 py-2">Published</th>
              </tr>
            </thead>
            <tbody>
              {published.map((draw) => (
                <tr key={draw.id} className="border-t border-white/10">
                  <td className="px-3 py-2">{draw.drawMonth}</td>
                  <td className="px-3 py-2">{draw.logicMode}</td>
                  <td className="px-3 py-2">{(draw.drawNumbers || []).join(", ")}</td>
                  <td className="px-3 py-2">{draw.publishedAt ? draw.publishedAt.slice(0, 10) : "-"}</td>
                </tr>
              ))}
              {published.length === 0 ? (
                <tr>
                  <td className="px-3 py-3" colSpan={4}>No draw results published.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}