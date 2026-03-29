import { Link } from "react-router-dom";
import { ROUTE_PATHS } from "../../app/routes";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";

export function SubscribeCancelledPage() {
  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Subscription"
        title="Checkout Cancelled"
        description="Your Stripe checkout was cancelled. You can try subscribing again anytime."
      />
      <Card title="Not Completed">
        <p className="text-sm text-slate-300">No payment was processed.</p>
        <div className="mt-4">
          <Link to={ROUTE_PATHS.public.subscribe}>
            <Button>Back to Subscribe</Button>
          </Link>
        </div>
      </Card>
    </section>
  );
}
