"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
async function main() {
    const hashedPassword = await bcrypt.hash('Admin1234!', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@aqp.com' },
        update: {},
        create: {
            name: 'Admin AQP',
            email: 'admin@aqp.com',
            password: hashedPassword,
            role: client_1.Role.ADMIN,
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
//# sourceMappingURL=seed.js.map