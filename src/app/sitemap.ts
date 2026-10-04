import type { MetadataRoute } from "next";
import { db } from "@/server/db";
import { env } from "@/server/env";

// Daftar barang berubah terus, jadi dibuat saat diminta, bukan saat build.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const products = await db.product.findMany({
        where: { status: "ACTIVE", deletedAt: null, store: { status: "ACTIVE", deletedAt: null } },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 5000,
    });

    return [
        { url: env.appUrl, changeFrequency: "daily", priority: 1 },
        { url: `${env.appUrl}/search`, changeFrequency: "daily", priority: 0.8 },
        ...products.map((p) => ({
            url: `${env.appUrl}/p/${p.slug}`,
            lastModified: p.updatedAt,
            changeFrequency: "weekly" as const,
            priority: 0.6,
        })),
    ];
}