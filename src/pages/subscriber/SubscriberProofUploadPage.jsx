import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { apiClient } from "../../lib/apiClient";

export function SubscriberProofUploadPage() {
  const location = useLocation();
  const selectedWinnerId = useMemo(() => new URLSearchParams(location.search).get("winnerId") || "", [location.search]);

  const [winners, setWinners] = useState([]);
  const [winnerId, setWinnerId] = useState("");
  const [proofScreenshot, setProofScreenshot] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    apiClient
      .getSubscriberWinners()
      .then((result) => {
        if (!active) {
          return;
        }
        const list = result.winners || [];
        setWinners(list);

        const target = list.find((item) => item.id === selectedWinnerId);
        if (target) {
          setWinnerId(target.id);
          setProofScreenshot(target.proofScreenshot || "");
        } else if (list.length > 0) {
          setWinnerId(list[0].id);
          setProofScreenshot(list[0].proofScreenshot || "");
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
  }, [selectedWinnerId]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!winnerId) {
      setError("Select a winner record first.");
      return;
    }

    if (!proofScreenshot.trim()) {
      setError("Proof screenshot is required.");
      return;
    }

    try {
      await apiClient.uploadWinnerProof(winnerId, { proofScreenshot });
      setMessage("Proof uploaded. Admin review is now pending.");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="space-y-5">
      <PageHeader
        eyebrow="Subscriber"
        title="Winner Proof Upload"
        description="Upload screenshot proof for winner records only."
      />

      <Card title="Proof Submission">
        {winners.length === 0 ? (
          <p className="text-sm text-slate-300">No winner records available for proof upload.</p>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <label className="block text-sm text-slate-200" htmlFor="winner-select">
              Winner record
              <select
                id="winner-select"
                value={winnerId}
                onChange={(event) => setWinnerId(event.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-slate-100"
              >
                {winners.map((winner) => (
                  <option key={winner.id} value={winner.id}>
                    {winner.drawMonth} | tier {winner.tier} | {winner.verificationStatus}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-slate-200" htmlFor="proof-screenshot">
              Proof screenshot reference
              <input
                id="proof-screenshot"
                type="text"
                value={proofScreenshot}
                onChange={(event) => setProofScreenshot(event.target.value)}
                placeholder="Paste screenshot URL or reference"
                className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-slate-100"
              />
            </label>

            {error ? <p className="text-sm text-red-300">{error}</p> : null}
            {message ? <p className="text-sm text-slate-300">{message}</p> : null}

            <Button type="submit">Submit Proof</Button>
          </form>
        )}
      </Card>
    </section>
  );
}