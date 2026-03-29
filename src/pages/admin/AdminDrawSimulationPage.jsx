import { PageHeader } from "../../components/ui/PageHeader";
import { PlaceholderPanel } from "../../components/ui/PlaceholderPanel";

export function AdminDrawSimulationPage() {
  return (
    <section className="space-y-4">
      <PageHeader eyebrow="Admin" title="Draw Simulation" description="Simulation preview area scaffolded without draw engine logic." />
      <PlaceholderPanel title="Simulation Output" />
    </section>
  );
}