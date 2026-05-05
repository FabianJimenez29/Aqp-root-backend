import { ItemStatus, OrderStatus } from '@prisma/client';
export declare class UpdateOrderItemDto {
    status: ItemStatus;
}
export declare class UpdateOrderStatusDto {
    status: OrderStatus;
    notes?: string;
    driverId?: string;
}
