import { useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { apiClient } from "../../lib/apiClient";

export function AdminWinnersPage() {
  const [winners, setWinners] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      const result = await apiClient.getAdminWinners();
      setWinners(result.winners || []);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function review(winnerId, decision) {
    try {
      await apiClient.reviewWinner(winnerId, { decision });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function markPaid(winnerId) {
    try {
      await apiClient.markWinnerPaid(winnerId);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="space-y-5">
      <PageHeader
        eyebrow="Admin"
        title="Winners Management"
        description="Review winner proof (approve/reject) and track payment state (pending/paid)."
      />

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <Card title="Winner Records">
        {winners.length === 0 ? (
          <p className="text-sm text-slate-300">No winner records found.</p>
        ) : (
          <ul className="space-y-3">
            {winners.map((winner) => (
              <li key={winner.id} className="rounded-xl border border-white/10 p-3 text-sm text-slate-300">
                <p>User: {winner.userId}</p>
                <p>Month: {winner.drawMonth}</p>
                <p>Tier: {winner.tier}-number match</p>
                <p>Proof: {winner.proofScreenshot ? "Uploaded" : "Missing"}</p>
                <p>Verification: {winner.verificationStatus}</p>
                <p>Payment: {winner.paymentState}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => review(winner.id, "approved")}>Approve</Button>
                  <Button variant="secondary" onClick={() => review(winner.id, "rejected")}>Reject</Button>
                  <Button onClick={() => markPaid(winner.id)}>Mark Paid</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}