import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ItemStatus, OrderStatus } from '@prisma/client';

export class UpdateOrderItemDto {
  @IsEnum(ItemStatus)
  status: ItemStatus;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  driverId?: string;
}
