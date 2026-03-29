export function PageHeader({ eyebrow, title, description }) {
  return (
    <header className="space-y-2">
      {eyebrow ? <p className="text-xs uppercase tracking-[0.2em] text-brand-300">{eyebrow}</p> : null}
      <h1 className="text-2xl font-semibold text-slate-50 md:text-3xl">{title}</h1>
      {description ? <p className="max-w-2xl text-sm text-slate-300 md:text-base">{description}</p> : null}
    </header>
  );
}