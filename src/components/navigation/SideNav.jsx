import { NavLink } from "react-router-dom";

export function SideNav({ title, items }) {
  return (
    <aside className="rounded-2xl border border-white/10 bg-surface-200/80 p-4 backdrop-blur">
      <p className="mb-3 text-xs uppercase tracking-[0.16em] text-slate-300">{title}</p>
      <div className="grid gap-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm transition ${
                isActive ? "bg-brand-600/20 text-brand-200" : "text-slate-300 hover:bg-white/5 hover:text-slate-50"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </aside>
  );
}