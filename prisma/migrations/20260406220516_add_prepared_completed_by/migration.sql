-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "completedById" TEXT,
ADD COLUMN     "preparedById" TEXT;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_preparedById_fkey" FOREIGN KEY ("preparedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
