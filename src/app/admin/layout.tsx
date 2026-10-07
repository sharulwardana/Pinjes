import { ReactNode } from "react";
import { getCurrentUser } from "@/server/session";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="flex-1 bg-canvas">
      <div className="shell py-8">
        {children}
      </div>
    </div>
  );
}
