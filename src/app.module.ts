import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    // Load .env variables globally across all modules
    ConfigModule.forRoot({ isGlobal: true }),

    // Shared Prisma database access
    PrismaModule,

    // Feature modules
    AuthModule,
    UsersModule,
    ProjectsModule,
    ProductsModule,
    OrdersModule,
  ],
})
export class AppModule {}
