import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { apiClient } from "../../lib/apiClient";

export function SubscriberWinningsPage() {
  const [winners, setWinners] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    apiClient
      .getSubscriberWinners()
      .then((result) => {
        if (active) {
          setWinners(result.winners || []);
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

  const totalWon = winners.reduce((sum, item) => sum + Number(item.winningAmount || 0), 0);

  return (
    <section className="space-y-5">
      <PageHeader
        eyebrow="Subscriber"
        title="Winnings"
        description="View winner records, verification state, and payment state."
      />

      <Card title="Summary">
        <p className="text-sm text-slate-300">Total won: {totalWon}</p>
      </Card>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <Card title="Winner Records">
        {winners.length === 0 ? (
          <p className="text-sm text-slate-300">No winner records yet.</p>
        ) : (
          <ul className="space-y-3">
            {winners.map((winner) => (
              <li key={winner.id} className="rounded-xl border border-white/10 p-3 text-sm text-slate-300">
                <p>Month: {winner.drawMonth}</p>
                <p>Tier: {winner.tier}-number match</p>
                <p>Winning Amount: {winner.winningAmount}</p>
                <p>Verification: {winner.verificationStatus}</p>
                <p>Payment: {winner.paymentState}</p>
                <div className="mt-3">
                  <Link to={`/dashboard/winnings/proof-upload?winnerId=${winner.id}`}>
                    <Button variant="ghost">Upload / Update Proof</Button>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}