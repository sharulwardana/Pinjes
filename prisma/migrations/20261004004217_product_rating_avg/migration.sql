-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pricePerDay" INTEGER NOT NULL,
    "securityDeposit" INTEGER NOT NULL DEFAULT 0,
    "stock" INTEGER NOT NULL DEFAULT 1,
    "minRentalDays" INTEGER NOT NULL DEFAULT 1,
    "maxRentalDays" INTEGER NOT NULL DEFAULT 30,
    "rentalTerms" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "ratingTotal" INTEGER NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "ratingAvg" REAL NOT NULL DEFAULT 0,
    "rentalCount" INTEGER NOT NULL DEFAULT 0,
    "lockVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("categoryId", "city", "createdAt", "deletedAt", "description", "id", "lockVersion", "maxRentalDays", "minRentalDays", "name", "pricePerDay", "province", "ratingCount", "ratingTotal", "rentalCount", "rentalTerms", "securityDeposit", "slug", "status", "stock", "storeId", "updatedAt") SELECT "categoryId", "city", "createdAt", "deletedAt", "description", "id", "lockVersion", "maxRentalDays", "minRentalDays", "name", "pricePerDay", "province", "ratingCount", "ratingTotal", "rentalCount", "rentalTerms", "securityDeposit", "slug", "status", "stock", "storeId", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE INDEX "Product_status_categoryId_idx" ON "Product"("status", "categoryId");
CREATE INDEX "Product_status_city_idx" ON "Product"("status", "city");
CREATE INDEX "Product_storeId_status_idx" ON "Product"("storeId", "status");
CREATE INDEX "Product_pricePerDay_idx" ON "Product"("pricePerDay");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
