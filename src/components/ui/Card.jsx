export function Card({ title, description, children }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-surface-200/70 p-5 backdrop-blur">
      {title ? <h3 className="text-base font-semibold text-slate-50">{title}</h3> : null}
      {description ? <p className="mt-2 text-sm text-slate-300">{description}</p> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}