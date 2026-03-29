import { Link } from "react-router-dom";
import { ROUTE_PATHS } from "../../app/routes";
import { PageHeader } from "../../components/ui/PageHeader";

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-app px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <PageHeader eyebrow="404" title="Page Not Found" description="This route does not exist in the current app skeleton." />
        <Link className="text-sm text-brand-200 underline" to={ROUTE_PATHS.public.home}>
          Back to home
        </Link>
      </div>
    </div>
  );
}