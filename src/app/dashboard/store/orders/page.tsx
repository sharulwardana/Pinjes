import { requireRole } from "@/server/session";
import { db } from "@/server/db";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function StoreOrdersPage() {
  const user = await requireRole(["STORE_OWNER"]);
  
  const bookings = await db.booking.findMany({
    where: { store: { ownerId: user.id } },
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { name: true, phone: true } },
      items: true,
      payment: true,
    }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Pesanan Masuk</h1>
      
      {bookings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 py-32 text-center">
          <p className="text-lg font-medium text-zinc-900">Belum ada pesanan</p>
          <p className="mt-1 text-sm text-zinc-500">Belum ada pelanggan yang menyewa barang Anda.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">#{booking.code}</h3>
                    <Badge variant={booking.status === "PENDING_PAYMENT" ? "destructive" : "default"}>
                      {booking.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-sm text-zinc-500 mt-1">Pemesan: {booking.customer.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-500">Total Harga</p>
                  <p className="font-bold text-lg text-zinc-900">Rp {booking.total.toLocaleString("id-ID")}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm text-zinc-600 bg-zinc-50 p-4 rounded-lg">
                <div>
                  <p className="font-medium text-zinc-900 mb-1">Barang disewa:</p>
                  <ul className="list-disc list-inside">
                    {booking.items.map(item => (
                      <li key={item.id}>{item.productName} ({item.days} hari)</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-zinc-900 mb-1">Jadwal:</p>
                  <p>{booking.startDate.toLocaleDateString("id-ID")} s/d {booking.endDate.toLocaleDateString("id-ID")}</p>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                {/* Normally we'd use Client Components for these actions to call mutations. 
                    For now we'll put dummy buttons or Links to a detail page. */}
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/store/orders/${booking.code}`}>
                    Kelola Pesanan
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
