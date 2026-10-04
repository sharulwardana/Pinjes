import { requireRole } from "@/server/session";
import Link from "next/link";

export default async function StoreDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["STORE_OWNER"]);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 flex flex-col md:flex-row gap-8">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 shrink-0">
        <div className="sticky top-24 space-y-1">
          <h2 className="px-4 text-lg font-semibold tracking-tight text-zinc-900 mb-4">
            Kelola Toko
          </h2>
          <nav className="flex flex-col space-y-1">
            <Link
              href="/dashboard/store"
              className="px-4 py-2 text-sm font-medium rounded-md hover:bg-zinc-100 text-zinc-900"
            >
              Ringkasan
            </Link>
            <Link
              href="/dashboard/store/products"
              className="px-4 py-2 text-sm font-medium rounded-md hover:bg-zinc-100 text-zinc-600"
            >
              Daftar Barang
            </Link>
            <Link
              href="/dashboard/store/orders"
              className="px-4 py-2 text-sm font-medium rounded-md hover:bg-zinc-100 text-zinc-600"
            >
              Pesanan Masuk
            </Link>
            <Link
              href="/dashboard/store/settings"
              className="px-4 py-2 text-sm font-medium rounded-md hover:bg-zinc-100 text-zinc-600"
            >
              Pengaturan Toko
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
