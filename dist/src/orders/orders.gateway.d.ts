import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private readonly logger;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinWarehouse(client: Socket): {
        event: string;
        data: string;
    };
    handleJoinOrder(client: Socket, data: {
        orderId: string;
    }): {
        event: string;
        data: string;
    };
    emitNewOrder(order: unknown): void;
    emitOrderUpdated(order: unknown & {
        id: string;
    }): void;
}
