import { PrismaClient } from "@prisma/client";
import { copyFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { slugify } from "@/lib/utils";

const db = new PrismaClient();

const UPLOADS_DIR = path.resolve(process.cwd(), "storage/uploads/product");
const ARTIFACTS_DIR = path.resolve(process.env.USERPROFILE || "", ".gemini/antigravity-ide/brain");

async function hash(pw: string) {
  return bcrypt.hash(pw, 12);
}

async function getArtifactImages() {
  try {
    const brainId = process.env.BRAIN_ID || "ea279b1f-aa10-4810-9b64-f1afda5b98f1";
    const dir = path.join(ARTIFACTS_DIR, brainId);
    const files = await readdir(dir);
    return files.filter(f => f.endsWith(".jpg")).map(f => path.join(dir, f));
  } catch (e) {
    console.error("No artifacts found", e);
    return [];
  }
}

export async function seed() {
  console.log("Seeding database...");
  
  await mkdir(UPLOADS_DIR, { recursive: true });
  
  const artifactImages = await getArtifactImages();
  const imagePaths: string[] = [];
  
  for (const file of artifactImages) {
    const destName = `${randomUUID()}.jpg`;
    await copyFile(file, path.join(UPLOADS_DIR, destName));
    imagePaths.push(`product/${destName}`);
  }
  
  if (imagePaths.length === 0) {
    imagePaths.push("product/placeholder.jpg");
  }



  // Ensure roles exist
  const roles = [
    { key: "ADMIN", name: "Admin", description: "Platform Administrator" },
    { key: "STORE_OWNER", name: "Store Owner", description: "Pemilik Toko Rental" },
    { key: "CUSTOMER", name: "Customer", description: "Penyewa Barang" }
  ];
  for (const r of roles) {
    await db.role.upsert({
      where: { key: r.key as any },
      update: {},
      create: {
        key: r.key as any,
        name: r.name,
      },
    });
  }

  // 1. Admin
  await db.user.create({
    data: { name: "Admin", email: "admin@pinjes.local", passwordHash: await hash("admin123"), roleKey: "ADMIN" }
  });

  // 2. Customer
  await db.user.create({
    data: { name: "Penyewa Budi", email: "budi@example.com", passwordHash: await hash("budi123"), roleKey: "CUSTOMER" }
  });

  // 3. Store Owner
  const owner = await db.user.create({
    data: { name: "Rendi Pemilik Toko", email: "rendi@example.com", passwordHash: await hash("rendi123"), roleKey: "STORE_OWNER" }
  });

  // 4. Categories
  const categories = [
    { id: "kamera", name: "Kamera", slug: "kamera" },
    { id: "camping", name: "Camping", slug: "camping" },
    { id: "elektronik", name: "Elektronik", slug: "elektronik" },
    { id: "kendaraan", name: "Kendaraan", slug: "kendaraan" },
    { id: "fashion", name: "Fashion", slug: "fashion" },
    { id: "lainnya", name: "Lainnya", slug: "lainnya" }
  ];
  for (const c of categories) {
    await db.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }

  // 5. Store
  const store = await db.store.create({
    data: {
      ownerId: owner.id,
      name: "Rendi Rent & Gear",
      slug: "rendi-rent",
      city: "Jakarta Selatan",
      description: "Pusat penyewaan kamera dan gear camping terbaik di Jakarta Selatan.",
      status: "ACTIVE"
    }
  });

  // 5. Products
  const products = [
    { name: "Canon EOS R6 Mark II", category: "kamera", price: 350000, dep: 1000000 },
    { name: "Sony Alpha A7 IV", category: "kamera", price: 400000, dep: 1200000 },
    { name: "Fujifilm X-T30 II", category: "kamera", price: 200000, dep: 500000 },
    { name: "DJI Mini 3 Pro Drone", category: "elektronik", price: 300000, dep: 1000000 },
    { name: "GoPro HERO 12 Black", category: "kamera", price: 150000, dep: 400000 },
    { name: "Tenda Dome 4 Orang Eiger", category: "camping", price: 75000, dep: 100000 },
    { name: "Carrier Bag 60L Consina", category: "camping", price: 50000, dep: 100000 },
    { name: "Proyektor Epson EB-X51", category: "elektronik", price: 250000, dep: 500000 },
    { name: "PlayStation 5 Slim", category: "elektronik", price: 300000, dep: 1500000 },
    { name: "Nintendo Switch OLED", category: "elektronik", price: 150000, dep: 800000 }
  ];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    // Assign a random artifact image if available, cycling through
    const photo = imagePaths[i % imagePaths.length];
    await db.product.create({
      data: {
        storeId: store.id,
        categoryId: p.category,
        name: p.name,
        slug: slugify(p.name) + `-${Math.random().toString(36).slice(2, 6)}`,
        description: `Sewa ${p.name} harian dengan harga bersahabat. Kondisi sangat terawat dan siap pakai.`,
        pricePerDay: p.price,
        securityDeposit: p.dep,
        stock: 2,
        city: store.city,
        images: {
          create: [{ path: photo }]
        },
        rentalCount: Math.floor(Math.random() * 50),
      }
    });
  }

  console.log("Seeding complete!");
}

seed().catch(console.error).finally(() => db.$disconnect());
