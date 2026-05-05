export declare class CreateOrderItemDto {
    productId: string;
    quantity: number;
}
export declare class CreateOrderDto {
    projectId: string;
    items: CreateOrderItemDto[];
}
