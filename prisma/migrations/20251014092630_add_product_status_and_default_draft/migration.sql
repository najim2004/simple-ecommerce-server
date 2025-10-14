-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "product" ADD COLUMN     "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT';
