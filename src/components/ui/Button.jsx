export function Button({ children, variant = "primary", className = "", ...props }) {
  const classes = {
    primary:
      "bg-brand-600 text-white hover:bg-brand-500 focus-visible:ring-brand-300 shadow-glow",
    secondary:
      "bg-surface-200 text-slate-100 hover:bg-surface-100 focus-visible:ring-slate-300",
    ghost: "bg-transparent text-slate-100 hover:bg-surface-200 focus-visible:ring-slate-300",
  };

  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 ${classes[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}