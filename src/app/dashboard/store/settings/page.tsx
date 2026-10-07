import { requireRole } from "@/server/session";
import { db } from "@/server/db";
import { ownStoreId } from "@/server/policies";
import { StoreSettingsForm } from "@/components/store-settings-form";

export default async function StoreSettingsPage() {
  const user = await requireRole(["STORE_OWNER"]);
  const store = await db.store.findUnique({ where: { id: ownStoreId(user) } });

  if (!store) return <div>Toko tidak ditemukan</div>;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">Pengaturan Toko</h1>
      <StoreSettingsForm store={store} />
    </div>
  );
}