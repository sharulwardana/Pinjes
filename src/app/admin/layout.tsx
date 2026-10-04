import { ReactNode } from "react";
import { getCurrentUser } from "@/server/session";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="flex-1 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
