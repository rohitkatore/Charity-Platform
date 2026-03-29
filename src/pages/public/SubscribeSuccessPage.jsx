import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ROUTE_PATHS } from "../../app/routes";
import { useAuth } from "../../auth/AuthProvider";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { apiClient } from "../../lib/apiClient";

export function SubscribeSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { refreshSession } = useAuth();
  const refreshSessionRef = useRef(refreshSession);
  const [message, setMessage] = useState("Confirming your subscription. Please wait...");
  const [error, setError] = useState("");

  useEffect(() => {
    refreshSessionRef.current = refreshSession;
  }, [refreshSession]);

  useEffect(() => {
    let active = true;

    async function completeFlow() {
      setError("");
      let lastError = "";
      for (let attempt = 1; attempt <= 8; attempt += 1) {
        try {
          const session = await refreshSessionRef.current();
          if (session?.subscription?.status === "active") {
            if (active) {
              setMessage("Subscription active. Redirecting to dashboard...");
              setTimeout(() => {
                if (active) {
                  navigate("/dashboard", { replace: true });
                }
              }, 800);
            }
            return;
          }

          if (sessionId) {
            setMessage(`Finalizing payment confirmation (attempt ${attempt}/8)...`);
            const result = await apiClient.confirmStripeCheckoutSession({ sessionId });
            if (result?.subscription?.status === "active") {
              const refreshedSession = await refreshSessionRef.current();
              if (refreshedSession?.subscription?.status === "active" && active) {
                setMessage("Subscription active. Redirecting to dashboard...");
                setTimeout(() => {
                  if (active) {
                    navigate("/dashboard", { replace: true });
                  }
                }, 800);
                return;
              }
            }
          }
        } catch (err) {
          lastError = err?.message || "Subscription confirmation failed";
          // Retry because webhook/session finalization can be delayed.
        }

        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      if (active) {
        setError(
          lastError
            ? `Payment was successful but activation is still pending. Last error: ${lastError}`
            : "Payment was successful but subscription activation is still pending. Please retry in a few seconds."
        );
      }
    }

    completeFlow();

    return () => {
      active = false;
    };
  }, [navigate, sessionId]);

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Subscription"
        title="Payment Successful"
        description="Your subscription payment was successful. We are finalizing activation."
      />
      <Card title="Success">
        <p className="text-sm text-slate-300">{message}</p>
        {error ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-red-300">{error}</p>
            <Link to={ROUTE_PATHS.public.subscribe} className="text-sm text-brand-200 underline">
              Back to Subscription
            </Link>
          </div>
        ) : null}
      </Card>
    </section>
  );
}
