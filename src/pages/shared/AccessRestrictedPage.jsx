import { Link, useSearchParams } from "react-router-dom";
import { ROUTE_PATHS } from "../../app/routes";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";

export function AccessRestrictedPage() {
  const [searchParams] = useSearchParams();
  const reason = searchParams.get("reason");

  const isRoleIssue = reason === "role";
  const isSubscriptionIssue = reason === "subscription";

  const description = isRoleIssue
    ? "You do not have the required permissions to access this area."
    : "This area requires an active subscriber subscription.";

  const nextStepText = isRoleIssue
    ? "This section is restricted to authorized roles. If you believe this is an error, please contact support."
    : "Start or restore a monthly or yearly plan to access subscriber features.";

  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="Access"
        title={isRoleIssue ? "Insufficient Permissions" : "Access Restricted"}
        description={description}
      />

      <Card title="Next Step">
        <p className="text-sm text-slate-300">{nextStepText}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {!isRoleIssue && (
            <Link to={ROUTE_PATHS.public.subscribe}>
              <Button>Go to Subscription</Button>
            </Link>
          )}
          <Link className="inline-flex items-center text-sm text-brand-200 underline" to={ROUTE_PATHS.public.home}>
            Return to home
          </Link>
        </div>
      </Card>
    </section>
  );
}