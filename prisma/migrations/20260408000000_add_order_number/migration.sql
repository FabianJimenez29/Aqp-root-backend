-- AlterTable: add auto-incrementing orderNumber to orders
ALTER TABLE "orders" ADD COLUMN "orderNumber" SERIAL NOT NULL;
