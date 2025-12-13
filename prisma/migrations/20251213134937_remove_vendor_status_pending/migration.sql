/*
  Warnings:

  - The values [Pending] on the enum `VendorStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "VendorStatus_new" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE');
ALTER TABLE "public"."Vendor" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Vendor" ALTER COLUMN "status" TYPE "VendorStatus_new" USING ("status"::text::"VendorStatus_new");
ALTER TYPE "VendorStatus" RENAME TO "VendorStatus_old";
ALTER TYPE "VendorStatus_new" RENAME TO "VendorStatus";
DROP TYPE "public"."VendorStatus_old";
ALTER TABLE "Vendor" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "Vendor" ALTER COLUMN "status" SET DEFAULT 'PENDING';
