/**
 * Prisma Seed Script
 * Creates an initial ADMIN user for development purposes.
 * Run with: npx ts-node prisma/seed.ts
 */
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Admin1234!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@aqp.com' },
    update: {},
    create: {
      name: 'Admin AQP',
      email: 'admin@aqp.com',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  console.log('✅ Seed complete. Admin created:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
