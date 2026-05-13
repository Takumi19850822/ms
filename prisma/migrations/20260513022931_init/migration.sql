-- CreateTable
CREATE TABLE "ResourceRecord" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "storeId" TEXT,
    "note" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResourceRecord_resourceId_idx" ON "ResourceRecord"("resourceId");

-- CreateIndex
CREATE INDEX "ResourceRecord_resourceId_storeId_idx" ON "ResourceRecord"("resourceId", "storeId");
