import { useEffect, useMemo, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { apiClient } from "../../lib/apiClient";

export function SubscriberScoresPage() {
  const [scores, setScores] = useState([]);
  const [scoreValue, setScoreValue] = useState("");
  const [scoreDate, setScoreDate] = useState("");
  const [editingScoreId, setEditingScoreId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiClient
      .getSubscriberScores()
      .then((result) => {
        if (!active) {
          return;
        }
        setScores(result.scores || []);
      })
      .catch((err) => {
        if (!active) {
          return;
        }
        setError(err.message);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const scoreCount = scores.length;
  const isEditMode = Boolean(editingScoreId);

  const helperText = useMemo(() => {
    if (scoreCount < 5) {
      return `You currently have ${scoreCount} of 5 scores stored.`;
    }

    return "You already have 5 scores. Adding a new one replaces the oldest stored score automatically.";
  }, [scoreCount]);

  function startEdit(score) {
    setEditingScoreId(score.id);
    setScoreValue(String(score.scoreValue));
    setScoreDate(score.scoreDate);
    setError("");
  }

  function clearForm() {
    setEditingScoreId(null);
    setScoreValue("");
    setScoreDate("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const numeric = Number(scoreValue);
    if (!Number.isFinite(numeric) || numeric < 1 || numeric > 45) {
      setError("Score must be between 1 and 45.");
      return;
    }

    if (!Number.isInteger(numeric)) {
      setError("Score must be a whole number (Stableford format).");
      return;
    }

    if (!scoreDate) {
      setError("Score date is required.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        scoreValue: numeric,
        scoreDate,
      };
      const result = editingScoreId
        ? await apiClient.editSubscriberScore(editingScoreId, payload)
        : await apiClient.addSubscriberScore(payload);
      setScores(result.scores || []);
      clearForm();
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
        title="Scores"
        description="Enter and edit your latest 5 Stableford scores. Scores are shown most recent first."
      />

      <Card title={isEditMode ? "Edit Score" : "Add Score"}>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-200" htmlFor="score-value">
              Score (1 to 45)
              <input
                id="score-value"
                type="number"
                min="1"
                max="45"
                step="1"
                required
                value={scoreValue}
                onChange={(event) => setScoreValue(event.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-slate-100"
              />
            </label>

            <label className="text-sm text-slate-200" htmlFor="score-date">
              Score Date
              <input
                id="score-date"
                type="date"
                required
                value={scoreDate}
                onChange={(event) => setScoreDate(event.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-slate-100"
              />
            </label>
          </div>

          <p className="text-xs text-slate-300">{helperText}</p>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEditMode ? "Update Score" : "Add Score"}
            </Button>
            {isEditMode ? (
              <Button type="button" variant="secondary" onClick={clearForm}>
                Cancel Edit
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <Card title="Stored Scores (Most Recent First)">
        {scores.length === 0 ? (
          <p className="text-sm text-slate-300">No scores saved yet.</p>
        ) : (
          <ul className="space-y-3">
            {scores.map((score) => (
              <li key={score.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 p-3">
                <div className="text-sm text-slate-200">
                  <p>
                    <span className="font-semibold text-slate-50">Score:</span> {score.scoreValue}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-50">Date:</span> {score.scoreDate}
                  </p>
                </div>
                <Button type="button" variant="ghost" onClick={() => startEdit(score)}>
                  Edit
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}