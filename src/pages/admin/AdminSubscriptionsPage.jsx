import { PageHeader } from "../../components/ui/PageHeader";
import { PlaceholderPanel } from "../../components/ui/PlaceholderPanel";

export function AdminSubscriptionsPage() {
  return (
    <section className="space-y-4">
      <PageHeader eyebrow="Admin" title="Subscription Management" description="Lifecycle controls layout only, no logic." />
      <PlaceholderPanel title="Subscriptions Table" />
    </section>
  );
}