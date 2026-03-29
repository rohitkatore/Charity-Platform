import { Outlet } from "react-router-dom";
import { SideNav } from "../components/navigation/SideNav";

const adminNav = [
  { label: "User Management", to: "/admin/users", end: true },
  { label: "Draw Management", to: "/admin/draws" },
  { label: "Charity Management", to: "/admin/charities" },
  { label: "Winners Management", to: "/admin/winners" },
  { label: "Reports & Analytics", to: "/admin/reports" },
];

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-app text-slate-100">
      <main className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-6 md:grid-cols-[280px_1fr] md:px-6 md:py-8">
        <SideNav title="Administrator" items={adminNav} />
        <section className="space-y-4">
          <Outlet />
        </section>
      </main>
    </div>
  );
}