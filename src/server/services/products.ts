import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "../db";
import { AppError } from "../errors";
import { assertStoreAccess } from "../policies";
import type { SessionUser } from "./auth";
import type { CreateProductInput, SearchInput } from "@/features/products/schemas";
import { unavailableProductIds } from "./availability";
import { resolveUploadPath } from "../uploads";
import { slugify } from "@/lib/utils";

const PAGE_SIZE = 24;

/** Kategori bisa dikirim sebagai id atau slug. Hasilnya selalu id yang valid. */
async function resolveCategoryId(value: string) {
  const category = await db.category.findFirst({
    where: { isActive: true, OR: [{ id: value }, { slug: value }] },
    select: { id: true },
  });
  if (!category) throw new AppError("Kategori tidak valid.", 400);
  return category.id;
}

/** Foto produk harus berupa file yang diunggah lewat jenis "product". */
function assertProductPhotos(photos: string[]) {
  for (const p of photos) {
    if (resolveUploadPath(p)?.kind !== "product") {
      throw new AppError("Foto produk tidak valid.", 400);
    }
  }
}

export async function createProduct(user: SessionUser, storeId: string, input: CreateProductInput) {
  assertStoreAccess(user, storeId);

  const store = await db.store.findUnique({ where: { id: storeId } });
  if (!store || store.deletedAt) throw new AppError("Toko tidak ditemukan.", 404);

  assertProductPhotos(input.photos);
  const categoryId = await resolveCategoryId(input.category);

  const baseSlug = slugify(input.name);
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`;

  return await db.product.create({
    data: {
      storeId,
      name: input.name,
      slug,
      description: input.description,
      categoryId,
      pricePerDay: input.pricePerDay,
      securityDeposit: input.deposit,
      stock: input.stock,
      status: input.status,
      city: store.city,
      images: {
        create: input.photos.map((p, i) => ({ path: p, sortOrder: i })),
      },
    },
  });
}

export async function updateProduct(user: SessionUser, storeId: string, productId: string, input: CreateProductInput) {
  assertStoreAccess(user, storeId);

  const categoryId = await resolveCategoryId(input.category);

  return await db.product.update({
    where: { id: productId, storeId, deletedAt: null },
    data: {
      name: input.name,
      description: input.description,
      categoryId,
      pricePerDay: input.pricePerDay,
      securityDeposit: input.deposit,
      stock: input.stock,
      status: input.status,
    },
  });
}

export async function deleteProduct(user: SessionUser, storeId: string, productId: string) {
  assertStoreAccess(user, storeId);
  await db.product.update({
    where: { id: productId, storeId, deletedAt: null },
    data: { status: "INACTIVE" },
  });
}

export async function searchProducts(input: SearchInput) {
  const where: Prisma.ProductWhereInput = {
    status: "ACTIVE",
    deletedAt: null,
    store: { status: "ACTIVE", deletedAt: null },
  };

  if (input.q) {
    where.name = { contains: input.q };
  }
  if (input.category) {
    where.category = { slug: input.category };
  }
  if (input.minPrice !== undefined || input.maxPrice !== undefined) {
    where.pricePerDay = {};
    if (input.minPrice !== undefined) where.pricePerDay.gte = input.minPrice;
    if (input.maxPrice !== undefined) where.pricePerDay.lte = input.maxPrice;
  }

  if (input.startDate && input.endDate) {
    const unavailableIds = await unavailableProductIds(input.startDate, input.endDate);
    if (unavailableIds.length > 0) {
      where.id = { notIn: unavailableIds };
    }
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = {};
  switch (input.sort) {
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
    case "price_asc":
      orderBy = { pricePerDay: "asc" };
      break;
    case "price_desc":
      orderBy = { pricePerDay: "desc" };
      break;
    case "rating":
      orderBy = { ratingAvg: "desc" };
      break;
    case "popular":
    default:
      orderBy = { rentalCount: "desc" };
      break;
  }

  const skip = (input.page - 1) * PAGE_SIZE;

  const [items, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy,
      skip,
      take: PAGE_SIZE,
      include: {
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            address: true,
            latitude: true,
            longitude: true,
            phone: true,
            whatsapp: true,
            status: true,
          },
        },
        images: { orderBy: { sortOrder: "asc" } },
        category: { select: { name: true, slug: true } },
      },
    }),
    db.product.count({ where }),
  ]);

  return {
    items: items.map((item) => ({
      ...item,
      deposit: item.securityDeposit,
      photos: item.images.map((img) => img.path),
    })),
    total,
    page: input.page,
    totalPages: Math.ceil(total / PAGE_SIZE),
  };
}

/**
 * Produk publik hanya yang ACTIVE dari toko ACTIVE.
 * Pemilik toko dan admin boleh melihat produk lain miliknya (pratinjau DRAFT/INACTIVE)
 * kalau `viewer` diteruskan.
 */
export async function getProductBySlug(slug: string, viewer?: SessionUser | null) {
  const product = await db.product.findUnique({
    where: { slug },
    include: {
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
          city: true,
          address: true,
          latitude: true,
          longitude: true,
          phone: true,
          whatsapp: true,
          status: true,
          logoPath: true,
          description: true,
        },
      },
      images: { orderBy: { sortOrder: "asc" } },
      category: { select: { name: true, slug: true } },
    },
  });
  if (!product || product.deletedAt) return null;

  const isOwnerOrAdmin =
    viewer?.role === "ADMIN" ||
    (viewer?.role === "STORE_OWNER" && viewer.storeId === product.storeId);

  if (!isOwnerOrAdmin && (product.status !== "ACTIVE" || product.store.status !== "ACTIVE")) {
    return null;
  }

  return {
    ...product,
    deposit: product.securityDeposit,
    categoryName: product.category.name,
    photos: product.images.map((img) => img.path),
  };
}