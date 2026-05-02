-- AlterTable
ALTER TABLE "Service" ADD COLUMN "open" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "History" ADD COLUMN "action" TEXT;
ALTER TABLE "History" ADD COLUMN "guestName" TEXT;
ALTER TABLE "History" ADD COLUMN "ticket" TEXT;
ALTER TABLE "History" ADD COLUMN "serviceId" INTEGER;
ALTER TABLE "History" ADD COLUMN "serviceName" TEXT;

-- CreateTable
CREATE TABLE "Notification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
