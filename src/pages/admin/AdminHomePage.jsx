import { PageHeader } from "../../components/ui/PageHeader";
import { PlaceholderPanel } from "../../components/ui/PlaceholderPanel";

export function AdminHomePage() {
  return (
    <section className="space-y-4">
      <PageHeader eyebrow="Admin" title="Admin Overview" description="Reporting and operational panels are scaffolded placeholders." />
      <div className="grid gap-4 md:grid-cols-2">
        <PlaceholderPanel title="Total Users" />
        <PlaceholderPanel title="Total Prize Pool" />
        <PlaceholderPanel title="Charity Contributions" />
        <PlaceholderPanel title="Draw Statistics" />
      </div>
    </section>
  );
}