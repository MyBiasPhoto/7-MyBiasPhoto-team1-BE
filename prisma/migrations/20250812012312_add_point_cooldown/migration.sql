-- CreateTable
CREATE TABLE "PointCooldown" (
    "userId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "nextAllowedAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PointCooldown_pkey" PRIMARY KEY ("userId","reason")
);

-- AddForeignKey
ALTER TABLE "PointCooldown" ADD CONSTRAINT "PointCooldown_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
