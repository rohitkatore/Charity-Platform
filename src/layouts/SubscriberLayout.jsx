import { Outlet } from "react-router-dom";
import { SideNav } from "../components/navigation/SideNav";

const subscriberNav = [
  { label: "Overview", to: "/dashboard", end: true },
  { label: "Subscription", to: "/dashboard/subscription" },
  { label: "Scores", to: "/dashboard/scores" },
  { label: "Charity", to: "/dashboard/charity" },
  { label: "Participation", to: "/dashboard/participation" },
  { label: "Winnings", to: "/dashboard/winnings" },
];

export function SubscriberLayout() {
  return (
    <div className="min-h-screen bg-app text-slate-100">
      <main className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-6 md:grid-cols-[260px_1fr] md:px-6 md:py-8">
        <SideNav title="Subscriber" items={subscriberNav} />
        <section className="space-y-4">
          <Outlet />
        </section>
      </main>
    </div>
  );
}