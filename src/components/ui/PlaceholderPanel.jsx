import { Card } from "./Card";

export function PlaceholderPanel({ title, children }) {
  return (
    <Card title={title} description="Scaffold-only placeholder. Business logic intentionally not implemented yet.">
      <div className="text-sm text-slate-300">{children}</div>
    </Card>
  );
}