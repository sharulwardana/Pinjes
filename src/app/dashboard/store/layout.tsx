import { requireRole } from "@/server/session";
import { db } from "@/server/db";
import { ownStoreId } from "@/server/policies";
import { StoreNav } from "@/components/store/store-nav";

export default async function StoreDashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["STORE_OWNER"]);
  const storeId = ownStoreId(user);

  const [store, awaitingCheck] = await Promise.all([
    db.store.findUnique({ where: { id: storeId }, select: { name: true } }),
    db.booking.count({ where: { storeId, status: "PAYMENT_SUBMITTED" } }),
  ]);

  return (
    <div className="shell flex flex-col gap-6 py-6 md:flex-row md:gap-10 md:py-10">
      <aside className="shrink-0 md:w-60">
        <div className="md:sticky md:top-24">
          <p className="text-eyebrow mb-1 hidden text-muted md:block">Kelola toko</p>
          <p className="mb-4 hidden truncate font-display text-xl font-bold tracking-tight md:block">
            {store?.name ?? "Tokoku"}
          </p>
          <StoreNav awaitingCheck={awaitingCheck} />
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
