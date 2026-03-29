import { Navigate, useLocation } from "react-router-dom";
import { ROUTE_PATHS } from "../app/routes";
import { useAuth } from "./AuthProvider";
import { PageHeader } from "../components/ui/PageHeader";

export function ProtectedRoute({ children }) {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-8">
        <PageHeader eyebrow="Loading" title="Checking session" description="Please wait while we validate your access." />
      </section>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTE_PATHS.public.login} replace />;
  }

  return children;
}

export function RoleBoundary({ allow, children }) {
  const { role } = useAuth();

  if (!allow.includes(role)) {
    return <Navigate to={`${ROUTE_PATHS.shared.accessRestricted}?reason=role`} replace />;
  }

  return children;
}

export function SubscriptionBoundary({ children }) {
  const { role, hasActiveSubscription } = useAuth();

  if (role === "subscriber" && !hasActiveSubscription) {
    return <Navigate to={`${ROUTE_PATHS.shared.accessRestricted}?reason=subscription`} replace />;
  }

  return children;
}