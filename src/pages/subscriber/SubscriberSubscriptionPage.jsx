import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ROUTE_PATHS } from "../../app/routes";
import { useAuth } from "../../auth/AuthProvider";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { apiClient } from "../../lib/apiClient";

function formatDate(isoString) {
  if (!isoString) return "none";
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return "none";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "none";
  }
}

export function SubscriberSubscriptionPage() {
  const navigate = useNavigate();
  const { subscription, refreshSession } = useAuth();
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [loadingAction, setLoadingAction] = useState("");
  const [error, setError] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);

  const isCancelled = subscription?.status === "cancellation" || subscription?.status === "lapsed";

  useEffect(() => {
    apiClient
      .getSubscriberProfile()
      .then((result) => {
        setEmail(result.profile?.email || "");
      })
      .catch(() => null);
  }, []);

  async function handleCancel() {
    setLoadingAction("cancel");
    setError("");
    try {
      await apiClient.cancelSubscription();
      await refreshSession();
      setShowCancelModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingAction("");
    }
  }

  async function handleRenew() {
    setLoadingAction("renew");
    setError("");
    try {
      await apiClient.renewSubscription();
      await refreshSession();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingAction("");
    }
  }

  async function handleProfileSave(event) {
    event.preventDefault();
    setError("");
    setProfileMessage("");

    if (!currentPassword) {
      setError("Current password is required to update profile settings.");
      return;
    }

    setLoadingAction("profile");
    try {
      await apiClient.updateSubscriberProfile({
        email,
        password: password || undefined,
        currentPassword,
      });
      setPassword("");
      setCurrentPassword("");
      setProfileMessage("Profile settings updated.");
      await refreshSession();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingAction("");
    }
  }

  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="Subscriber"
        title="Subscription"
        description="Manage lifecycle states including active, renewal, cancellation, and lapsed."
      />

      <Card title="Current Status">
        <div className="space-y-2 text-sm text-slate-300">
          <p>Status: <span className="capitalize font-medium text-slate-100">{subscription?.status || "none"}</span></p>
          <p>Plan: {subscription?.planId || "none"}</p>
          <p>Renewal date: {formatDate(subscription?.renewalDate)}</p>
        </div>
      </Card>

      <Card title="Lifecycle Actions">
        {isCancelled ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-300">
              Your subscription has been cancelled. To regain access to subscriber features, please start a new subscription.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to={ROUTE_PATHS.public.subscribe}>
                <Button>Resubscribe</Button>
              </Link>
              <Button variant="secondary" onClick={handleRenew} disabled={loadingAction.length > 0}>
                {loadingAction === "renew" ? "Renewing..." : "Renew Subscription"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleRenew} disabled={loadingAction.length > 0}>
              {loadingAction === "renew" ? "Renewing..." : "Renew Subscription"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowCancelModal(true)}
              disabled={loadingAction.length > 0}
            >
              Cancel Subscription
            </Button>
          </div>
        )}
        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      </Card>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-surface-200 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-50">Cancel Subscription?</h3>
            <p className="mt-2 text-sm text-slate-300">
              Are you sure you want to cancel your subscription? You will lose access to subscriber features including score entry, draw participation, and charity contributions.
            </p>
            <p className="mt-2 text-xs text-amber-300">
              This action will take effect immediately.
            </p>
            <div className="mt-5 flex gap-3">
              <Button
                onClick={handleCancel}
                disabled={loadingAction === "cancel"}
              >
                {loadingAction === "cancel" ? "Cancelling..." : "Yes, Cancel"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowCancelModal(false)}
                disabled={loadingAction === "cancel"}
              >
                Keep Subscription
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card title="Profile Settings">
        <form className="space-y-4" onSubmit={handleProfileSave} noValidate>
          <label className="block text-sm text-slate-200" htmlFor="subscriber-email">
            Email
            <input
              id="subscriber-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-slate-100"
            />
          </label>

          <label className="block text-sm text-slate-200" htmlFor="subscriber-current-password">
            Current Password <span className="text-red-400">*</span>
            <input
              id="subscriber-current-password"
              type="password"
              required
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="Required to save changes"
              className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-slate-100"
            />
          </label>

          <label className="block text-sm text-slate-200" htmlFor="subscriber-password">
            New Password (optional)
            <input
              id="subscriber-password"
              type="password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-slate-100"
            />
          </label>

          <Button type="submit" disabled={loadingAction.length > 0}>
            {loadingAction === "profile" ? "Saving..." : "Save Profile Settings"}
          </Button>
          {profileMessage ? <p className="text-sm text-emerald-300">{profileMessage}</p> : null}
        </form>
      </Card>
    </section>
  );
}