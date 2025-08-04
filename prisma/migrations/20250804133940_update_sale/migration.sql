/*
  Warnings:

  - You are about to drop the column `status` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `userCardId` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `isOnSale` on the `UserCard` table. All the data in the column will be lost.
  - Added the required column `message` to the `ExchangeProposal` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `PhotoCard` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `type` to the `Purchase` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userCardId` to the `Purchase` table without a default value. This is not possible if the table is not empty.
  - Added the required column `initialQuantity` to the `Sale` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `Sale` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserCardStatus" AS ENUM ('IDLE', 'ON_SALE', 'PROPOSED');

-- CreateEnum
CREATE TYPE "PurchaseType" AS ENUM ('POINT', 'EXCHANGE');

-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_userCardId_fkey";

-- AlterTable
ALTER TABLE "ExchangeProposal" ADD COLUMN     "message" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PhotoCard" ALTER COLUMN "description" SET NOT NULL;

-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "type" "PurchaseType" NOT NULL,
ADD COLUMN     "userCardId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Sale" DROP COLUMN "status",
DROP COLUMN "userCardId",
ADD COLUMN     "initialQuantity" INTEGER NOT NULL,
ADD COLUMN     "quantity" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "UserCard" DROP COLUMN "isOnSale",
ADD COLUMN     "status" "UserCardStatus" NOT NULL DEFAULT 'IDLE';

-- DropEnum
DROP TYPE "SaleStatus";

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_userCardId_fkey" FOREIGN KEY ("userCardId") REFERENCES "UserCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
