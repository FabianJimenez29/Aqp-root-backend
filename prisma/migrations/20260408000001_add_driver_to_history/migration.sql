-- AlterTable: add driver snapshot fields to order_history
ALTER TABLE "order_history"
  ADD COLUMN "driverId"        TEXT,
  ADD COLUMN "driverName"      TEXT,
  ADD COLUMN "driverSignature" TEXT;
