/*
  Warnings:

  - You are about to drop the column `subCategoryId` on the `Product` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_subCategoryId_fkey";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "subCategoryId";

-- CreateTable
CREATE TABLE "_ProductToSubCategory" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductToSubCategory_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ProductToSubCategory_B_index" ON "_ProductToSubCategory"("B");

-- AddForeignKey
ALTER TABLE "_ProductToSubCategory" ADD CONSTRAINT "_ProductToSubCategory_A_fkey" FOREIGN KEY ("A") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToSubCategory" ADD CONSTRAINT "_ProductToSubCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "SubCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
