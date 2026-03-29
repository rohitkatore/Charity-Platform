import { Link } from "react-router-dom";
import { ROUTE_PATHS } from "../../app/routes";
import { useAuth } from "../../auth/AuthProvider";
import { Button } from "../ui/Button";

const links = [
  { label: "Home", to: ROUTE_PATHS.public.home },
  { label: "Charities", to: ROUTE_PATHS.public.charities },
  { label: "Draw Mechanics", to: ROUTE_PATHS.public.drawMechanics },
];

export function PublicTopNav() {
  const { loading, isAuthenticated, role, hasActiveSubscription, clearSession } = useAuth();

  return (
    <nav className="sticky top-0 z-20 border-b border-white/10 bg-surface-300/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <Link to={ROUTE_PATHS.public.home} className="text-sm font-semibold tracking-[0.18em] text-slate-100">
          IMPACT FAIRWAY
        </Link>
        <div className="hidden items-center gap-4 md:flex">
          {links.map((link) => (
            <Link key={link.to} to={link.to} className="text-sm text-slate-300 transition hover:text-slate-50">
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {!loading && !isAuthenticated ? (
            <>
              <Link to={ROUTE_PATHS.public.login} className="text-sm text-slate-300 transition hover:text-slate-50">
                Login
              </Link>
              <Link to={ROUTE_PATHS.public.subscribe}>
                <Button>Subscribe</Button>
              </Link>
            </>
          ) : null}

          {!loading && isAuthenticated ? (
            <>
              {role === "admin" ? (
                <Link to="/admin" className="text-sm text-slate-300 transition hover:text-slate-50">
                  Admin Panel
                </Link>
              ) : (
                <Link
                  to={hasActiveSubscription ? "/dashboard" : ROUTE_PATHS.public.subscribe}
                  className="text-sm text-slate-300 transition hover:text-slate-50"
                >
                  {hasActiveSubscription ? "Dashboard" : "Subscribe"}
                </Link>
              )}
              <Button
                variant="ghost"
                onClick={() => {
                  clearSession().catch(() => {});
                }}
              >
                Logout
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  );
}