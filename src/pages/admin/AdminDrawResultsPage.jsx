import { PageHeader } from "../../components/ui/PageHeader";
import { PlaceholderPanel } from "../../components/ui/PlaceholderPanel";

export function AdminDrawResultsPage() {
  return (
    <section className="space-y-4">
      <PageHeader eyebrow="Admin" title="Draw Results" description="Results publication shell prepared without draw execution." />
      <PlaceholderPanel title="Published Results" />
    </section>
  );
}