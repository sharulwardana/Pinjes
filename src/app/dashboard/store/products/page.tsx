import { requireRole } from "@/server/session";
import { db } from "@/server/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function StoreProductsPage() {
  const user = await requireRole(["STORE_OWNER"]);
  
  const products = await db.product.findMany({
    where: { storeId: user.storeId!, status: { not: "INACTIVE" as any } },
    orderBy: { createdAt: "desc" },
    include: { images: { take: 1 } }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Daftar Barang</h1>
        <Button asChild>
          <Link href="/dashboard/store/products/new">Tambah Barang</Link>
        </Button>
      </div>
      
      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 py-32 text-center">
          <p className="text-lg font-medium text-zinc-900">Belum ada barang</p>
          <p className="mt-1 text-sm text-zinc-500 mb-4">Mulai sewakan barang-barang nganggur di rumahmu.</p>
          <Button asChild variant="outline">
            <Link href="/dashboard/store/products/new">Tambah Barang Pertamamu</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-3 font-medium">Barang</th>
                <th className="px-6 py-3 font-medium">Harga / Hari</th>
                <th className="px-6 py-3 font-medium">Deposit</th>
                <th className="px-6 py-3 font-medium">Stok</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {products.map(product => (
                <tr key={product.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 rounded bg-zinc-200 overflow-hidden border border-zinc-200">
                        {product.images[0] && (
                          <img src={`/api/files/${product.images[0].path}`} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <Link href={`/p/${product.slug}`} className="font-medium text-zinc-900 hover:underline">
                        {product.name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium">Rp {product.pricePerDay.toLocaleString("id-ID")}</td>
                  <td className="px-6 py-4">Rp {product.securityDeposit.toLocaleString("id-ID")}</td>
                  <td className="px-6 py-4">{product.stock}</td>
                  <td className="px-6 py-4">
                    <Badge variant={product.status === "ACTIVE" ? "default" : "secondary"}>
                      {product.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
