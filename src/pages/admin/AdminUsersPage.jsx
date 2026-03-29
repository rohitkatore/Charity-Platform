import { useEffect, useMemo, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { apiClient } from "../../lib/apiClient";

export function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [scores, setScores] = useState([]);
  const [emailEdit, setEmailEdit] = useState("");
  const [subscriptionStatus, setSubscriptionStatus] = useState("active");
  const [renewalDate, setRenewalDate] = useState("");
  const [scoreValue, setScoreValue] = useState("");
  const [scoreDate, setScoreDate] = useState("");
  const [editingScoreId, setEditingScoreId] = useState("");
  const [error, setError] = useState("");

  const selectedUser = useMemo(
    () => users.find((item) => item.id === selectedUserId) || null,
    [users, selectedUserId]
  );

  async function loadUsers() {
    const result = await apiClient.getAdminUsers();
    const list = result.users || [];
    setUsers(list);
    if (!selectedUserId && list.length > 0) {
      setSelectedUserId(list[0].id);
      setEmailEdit(list[0].email);
      setSubscriptionStatus(list[0].subscription?.status || "active");
      setRenewalDate((list[0].subscription?.renewalDate || "").slice(0, 10));
    }
  }

  useEffect(() => {
    let active = true;
    loadUsers().catch((err) => {
      if (active) {
        setError(err.message);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedUserId) {
      return;
    }

    const user = users.find((entry) => entry.id === selectedUserId);
    setEmailEdit(user?.email || "");
    setSubscriptionStatus(user?.subscription?.status || "active");
    setRenewalDate((user?.subscription?.renewalDate || "").slice(0, 10));

    apiClient
      .getAdminUserScores(selectedUserId)
      .then((result) => setScores(result.scores || []))
      .catch((err) => setError(err.message));
  }, [selectedUserId, users]);

  async function saveProfile() {
    if (!selectedUserId) {
      return;
    }
    try {
      setError("");
      await apiClient.updateAdminUser(selectedUserId, { email: emailEdit });
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveSubscription() {
    if (!selectedUserId) {
      return;
    }
    try {
      setError("");
      await apiClient.updateAdminUserSubscription(selectedUserId, {
        status: subscriptionStatus,
        renewalDate,
        planId: selectedUser?.subscription?.planId || "monthly",
      });
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveScore(event) {
    event.preventDefault();
    if (!selectedUserId) {
      return;
    }
    try {
      setError("");
      const payload = { scoreValue: Number(scoreValue), scoreDate };
      const result = editingScoreId
        ? await apiClient.editAdminUserScore(selectedUserId, editingScoreId, payload)
        : await apiClient.addAdminUserScore(selectedUserId, payload);
      setScores(result.scores || []);
      setScoreValue("");
      setScoreDate("");
      setEditingScoreId("");
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEditScore(score) {
    setEditingScoreId(score.id);
    setScoreValue(String(score.scoreValue));
    setScoreDate(score.scoreDate);
  }

  return (
    <section className="space-y-5">
      <PageHeader
        eyebrow="Admin"
        title="User Management"
        description="View and edit profiles, edit golf scores, and manage subscriptions."
      />

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <Card title="Users">
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-200">
              <tr>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Subscription</th>
                <th className="px-3 py-2">Scores</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className={`cursor-pointer border-t border-white/10 ${selectedUserId === user.id ? "bg-brand-600/10" : ""}`}
                >
                  <td className="px-3 py-2">{user.email}</td>
                  <td className="px-3 py-2">{user.role}</td>
                  <td className="px-3 py-2">{user.subscription?.status || "none"}</td>
                  <td className="px-3 py-2">{user.scoreCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Edit Profile">
          <label className="block text-sm text-slate-200" htmlFor="admin-user-email">
            Email
            <input
              id="admin-user-email"
              value={emailEdit}
              onChange={(event) => setEmailEdit(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-slate-100"
            />
          </label>
          <div className="mt-3">
            <Button onClick={saveProfile} disabled={!selectedUserId}>Save Profile</Button>
          </div>
        </Card>

        <Card title="Manage Subscription">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-200" htmlFor="admin-user-sub-status">
              Status
              <select
                id="admin-user-sub-status"
                value={subscriptionStatus}
                onChange={(event) => setSubscriptionStatus(event.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-slate-100"
              >
                <option value="active">active</option>
                <option value="renewal">renewal</option>
                <option value="cancellation">cancellation</option>
                <option value="lapsed">lapsed</option>
              </select>
            </label>
            <label className="text-sm text-slate-200" htmlFor="admin-user-sub-renewal">
              Renewal Date
              <input
                id="admin-user-sub-renewal"
                type="date"
                value={renewalDate}
                onChange={(event) => setRenewalDate(event.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-slate-100"
              />
            </label>
          </div>
          <div className="mt-3">
            <Button onClick={saveSubscription} disabled={!selectedUserId}>Save Subscription</Button>
          </div>
        </Card>
      </div>

      <Card title="Edit Golf Scores">
        <form onSubmit={saveScore} className="grid gap-4" noValidate>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-200" htmlFor="admin-user-score-value">
              Score
              <input
                id="admin-user-score-value"
                type="number"
                min="1"
                max="45"
                value={scoreValue}
                onChange={(event) => setScoreValue(event.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-slate-100"
              />
            </label>
            <label className="text-sm text-slate-200" htmlFor="admin-user-score-date">
              Date
              <input
                id="admin-user-score-date"
                type="date"
                value={scoreDate}
                onChange={(event) => setScoreDate(event.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-slate-100"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={!selectedUserId}>{editingScoreId ? "Update Score" : "Add Score"}</Button>
            {editingScoreId ? (
              <Button type="button" variant="secondary" onClick={() => setEditingScoreId("")}>Cancel Edit</Button>
            ) : null}
          </div>
        </form>

        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-200">
              <tr>
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((score) => (
                <tr key={score.id} className="border-t border-white/10">
                  <td className="px-3 py-2">{score.scoreValue}</td>
                  <td className="px-3 py-2">{score.scoreDate}</td>
                  <td className="px-3 py-2">
                    <Button type="button" variant="ghost" onClick={() => startEditScore(score)}>Edit</Button>
                  </td>
                </tr>
              ))}
              {scores.length === 0 ? (
                <tr>
                  <td className="px-3 py-3" colSpan={3}>No scores for selected user.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}