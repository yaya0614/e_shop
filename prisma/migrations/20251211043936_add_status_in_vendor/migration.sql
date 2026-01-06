/*
  Warnings:

  - Made the column `vendorId` on table `Order` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('Pending', 'ACTIVE', 'INACTIVE');

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_vendorId_fkey";

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "vendorId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "status" "VendorStatus" NOT NULL DEFAULT 'Pending';

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
