"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var OrdersGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
let OrdersGateway = OrdersGateway_1 = class OrdersGateway {
    constructor() {
        this.logger = new common_1.Logger(OrdersGateway_1.name);
    }
    handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
        const role = client.handshake.auth?.role;
        if (role === 'WAREHOUSE') {
            client.join('warehouse');
            this.logger.log(`Client ${client.id} joined [warehouse] room`);
        }
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    handleJoinWarehouse(client) {
        client.join('warehouse');
        this.logger.log(`Client ${client.id} joined [warehouse] room via event`);
        return { event: 'joined', data: 'warehouse' };
    }
    handleJoinOrder(client, data) {
        const room = `order:${data.orderId}`;
        client.join(room);
        this.logger.log(`Client ${client.id} subscribed to [${room}]`);
        return { event: 'joined', data: room };
    }
    emitNewOrder(order) {
        this.logger.log(`Emitting [new_order] to warehouse room`);
        this.server.to('warehouse').emit('new_order', order);
    }
    emitOrderUpdated(order) {
        const orderData = order;
        this.logger.log(`Emitting [order_updated] for order ${orderData.id}`);
        this.server.to(`order:${orderData.id}`).emit('order_updated', order);
        this.server.to('warehouse').emit('order_updated', order);
    }
};
exports.OrdersGateway = OrdersGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], OrdersGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_warehouse'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], OrdersGateway.prototype, "handleJoinWarehouse", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_order'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], OrdersGateway.prototype, "handleJoinOrder", null);
exports.OrdersGateway = OrdersGateway = OrdersGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    })
], OrdersGateway);
//# sourceMappingURL=orders.gateway.js.map