import { Outlet } from "react-router-dom";
import { PublicTopNav } from "../components/navigation/PublicTopNav";

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-app text-slate-100">
      <PublicTopNav />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <Outlet />
      </main>
    </div>
  );
}