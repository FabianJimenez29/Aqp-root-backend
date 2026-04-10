import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrdersGateway } from './orders.gateway';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    NotificationsModule, // For sending push notifications on order events
    UsersModule,         // For fetching warehouse users' push tokens
  ],
  providers: [
    OrdersService,
    OrdersGateway,
  ],
  controllers: [OrdersController],
})
export class OrdersModule {}
