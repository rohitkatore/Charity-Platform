import { Card } from "../ui/Card";

export function AuthForm({ title, description, children }) {
  return (
    <section className="mx-auto max-w-md space-y-5">
      <div className="space-y-2 text-center">
        <p className="text-xs font-semibold tracking-[0.18em] text-brand-200">IMPACT FAIRWAY</p>
        <h1 className="text-2xl font-semibold text-slate-50">{title}</h1>
        {description ? <p className="text-sm text-slate-300">{description}</p> : null}
      </div>
      <Card>{children}</Card>
    </section>
  );
}
