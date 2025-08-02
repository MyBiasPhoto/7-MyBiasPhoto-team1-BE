/*
  Warnings:

  - The values [IDOL,SPORTS,ART,OTHER] on the enum `CardGenre` will be removed. If these variants are still used in the database, this will fail.
  - The values [NORMAL] on the enum `CardGrade` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `createdById` on the `PhotoCard` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `UserCard` table. All the data in the column will be lost.
  - Added the required column `creatorId` to the `PhotoCard` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerId` to the `UserCard` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CardGenre_new" AS ENUM ('ALBUM', 'SPECIAL', 'FANSIGN', 'SEASON_GREETING', 'FANMEETING', 'CONCERT', 'MD', 'COLLAB', 'FANCLUB', 'ETC');
ALTER TABLE "PhotoCard" ALTER COLUMN "genre" TYPE "CardGenre_new" USING ("genre"::text::"CardGenre_new");
ALTER TABLE "Sale" ALTER COLUMN "desiredGenre" TYPE "CardGenre_new" USING ("desiredGenre"::text::"CardGenre_new");
ALTER TYPE "CardGenre" RENAME TO "CardGenre_old";
ALTER TYPE "CardGenre_new" RENAME TO "CardGenre";
DROP TYPE "CardGenre_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "CardGrade_new" AS ENUM ('COMMON', 'RARE', 'SUPER_RARE', 'LEGENDARY');
ALTER TABLE "PhotoCard" ALTER COLUMN "grade" TYPE "CardGrade_new" USING ("grade"::text::"CardGrade_new");
ALTER TABLE "Sale" ALTER COLUMN "desiredGrade" TYPE "CardGrade_new" USING ("desiredGrade"::text::"CardGrade_new");
ALTER TYPE "CardGrade" RENAME TO "CardGrade_old";
ALTER TYPE "CardGrade_new" RENAME TO "CardGrade";
DROP TYPE "CardGrade_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "PhotoCard" DROP CONSTRAINT "PhotoCard_createdById_fkey";

-- DropForeignKey
ALTER TABLE "UserCard" DROP CONSTRAINT "UserCard_userId_fkey";

-- AlterTable
ALTER TABLE "PhotoCard" DROP COLUMN "createdById",
ADD COLUMN     "creatorId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "UserCard" DROP COLUMN "userId",
ADD COLUMN     "ownerId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "PhotoCard" ADD CONSTRAINT "PhotoCard_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCard" ADD CONSTRAINT "UserCard_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
