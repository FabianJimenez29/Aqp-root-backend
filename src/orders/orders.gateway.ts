/**
 * OrdersGateway – WebSocket Gateway (Socket.IO)
 *
 * This gateway handles real-time communication between the backend and
 * connected mobile clients (Warehouse and Project users).
 *
 * Events emitted TO clients:
 *   - "new_order"     → Sent to all warehouse clients when an order is created
 *   - "order_updated" → Sent to all relevant clients when an item status changes
 *
 * Client-to-server events:
 *   - "join_warehouse" → Warehouse clients join the "warehouse" room
 *   - "join_order"     → Clients subscribe to updates for a specific order
 */
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // Allow mobile clients to connect
    methods: ['GET', 'POST'],
  },
})
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(OrdersGateway.name);

  // ─── Lifecycle Hooks ──────────────────────────────────────────────────────

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    // Auto-join "warehouse" room if client identifies as WAREHOUSE
    const role = client.handshake.auth?.role;
    if (role === 'WAREHOUSE') {
      client.join('warehouse');
      this.logger.log(`Client ${client.id} joined [warehouse] room`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ─── Client-Side Events ───────────────────────────────────────────────────

  /**
   * Allows warehouse clients to explicitly join the warehouse room.
   * Useful when the role is established after initial connection.
   */
  @SubscribeMessage('join_warehouse')
  handleJoinWarehouse(@ConnectedSocket() client: Socket) {
    client.join('warehouse');
    this.logger.log(`Client ${client.id} joined [warehouse] room via event`);
    return { event: 'joined', data: 'warehouse' };
  }

  /**
   * Allows clients to subscribe to updates for a specific order.
   * Example: Order detail screen watches for real-time item status changes.
   */
  @SubscribeMessage('join_order')
  handleJoinOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ) {
    const room = `order:${data.orderId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} subscribed to [${room}]`);
    return { event: 'joined', data: room };
  }

  // ─── Server-Side Emitters (called by OrdersService) ──────────────────────

  /**
   * Broadcasts a new order to all connected warehouse clients.
   * Called after a PROJECT user creates an order.
   */
  emitNewOrder(order: unknown) {
    this.logger.log(`Emitting [new_order] to warehouse room`);
    this.server.to('warehouse').emit('new_order', order);
  }

  /**
   * Broadcasts an order update to clients subscribed to that order's room.
   * Also notifies warehouse room for the global order list.
   */
  emitOrderUpdated(order: unknown & { id: string }) {
    const orderData = order as { id: string };
    this.logger.log(`Emitting [order_updated] for order ${orderData.id}`);
    // Emit to the specific order room (e.g. order detail screen)
    this.server.to(`order:${orderData.id}`).emit('order_updated', order);
    // Also notify the warehouse list so it can refresh statuses
    this.server.to('warehouse').emit('order_updated', order);
  }
}
