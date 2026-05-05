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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const orders_gateway_1 = require("./orders.gateway");
const notifications_service_1 = require("../notifications/notifications.service");
const users_service_1 = require("../users/users.service");
const client_1 = require("@prisma/client");
const ORDER_INCLUDE = {
    project: true,
    user: { select: { id: true, name: true, email: true, role: true } },
    preparedBy: { select: { id: true, name: true, email: true } },
    completedBy: { select: { id: true, name: true, email: true } },
    driver: { select: { id: true, name: true, email: true, signature: true } },
    orderItems: {
        include: {
            product: true,
        },
    },
    history: {
        orderBy: { createdAt: 'asc' },
    },
    photos: {
        orderBy: { createdAt: 'asc' },
    },
};
const ORDER_LIST_INCLUDE = {
    project: true,
    user: { select: { id: true, name: true, email: true, role: true } },
    preparedBy: { select: { id: true, name: true, email: true } },
    completedBy: { select: { id: true, name: true, email: true } },
    driver: { select: { id: true, name: true, email: true } },
    orderItems: {
        include: {
            product: true,
        },
    },
    history: {
        orderBy: { createdAt: 'asc' },
    },
};
let OrdersService = class OrdersService {
    constructor(prisma, ordersGateway, notificationsService, usersService) {
        this.prisma = prisma;
        this.ordersGateway = ordersGateway;
        this.notificationsService = notificationsService;
        this.usersService = usersService;
    }
    async create(dto, user) {
        const order = await this.prisma.order.create({
            data: {
                projectId: dto.projectId,
                userId: user.sub,
                orderItems: {
                    create: dto.items.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                    })),
                },
            },
            include: ORDER_INCLUDE,
        });
        this.ordersGateway.emitNewOrder(order);
        this.usersService.getWarehousePushTokens().then((tokens) => {
            if (tokens.length > 0) {
                this.notificationsService.sendNewOrderNotification(order.project.name, tokens, order.id);
            }
        });
        return order;
    }
    async findAll(user) {
        const where = user.role === client_1.Role.PROJECT ? { userId: user.sub } : undefined;
        return this.prisma.order.findMany({
            where,
            include: ORDER_LIST_INCLUDE,
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id, includeHeavy = false) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: includeHeavy ? ORDER_INCLUDE : ORDER_LIST_INCLUDE,
        });
        if (!order) {
            throw new common_1.NotFoundException(`Order ${id} not found`);
        }
        return order;
    }
    async updateItemStatus(orderId, itemId, dto, user) {
        if (user.role === client_1.Role.PROJECT) {
            throw new common_1.ForbiddenException('Only warehouse staff can update item status');
        }
        const item = await this.prisma.orderItem.findFirst({
            where: { id: itemId, orderId },
        });
        if (!item) {
            throw new common_1.NotFoundException(`Item ${itemId} not found in order ${orderId}`);
        }
        await this.prisma.orderItem.update({
            where: { id: itemId },
            data: { status: dto.status },
        });
        await this.prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'IN_PROGRESS',
                preparedById: user.sub,
            },
        });
        const finalOrder = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: ORDER_LIST_INCLUDE,
        });
        this.ordersGateway.emitOrderUpdated(finalOrder);
        return finalOrder;
    }
    async updateOrderStatus(id, dto, user) {
        if (user.role === client_1.Role.PROJECT) {
            throw new common_1.ForbiddenException('Project users cannot update order status');
        }
        const existing = await this.prisma.order.findUnique({
            where: { id },
            select: { status: true },
        });
        const wasAlreadyCompleted = existing?.status === 'COMPLETED';
        const hasPendingNotes = dto.notes && dto.notes.trim() !== '';
        const actingUser = await this.prisma.user.findUnique({
            where: { id: user.sub },
            select: { name: true },
        });
        const actingName = actingUser?.name ?? user.email;
        let action;
        if (wasAlreadyCompleted) {
            action = 'ALISTO_PENDIENTES';
        }
        else if (hasPendingNotes) {
            action = 'ENVIO_CON_PENDIENTES';
        }
        else {
            action = 'ENVIO';
        }
        await this.prisma.order.update({
            where: { id },
            data: {
                status: dto.status,
                ...(dto.status === 'COMPLETED' && { completedById: user.sub }),
                ...(dto.driverId && { driverId: dto.driverId }),
                ...(dto.notes !== undefined && { notes: dto.notes === '' ? null : dto.notes }),
            },
        });
        let driverId;
        let driverName;
        let driverSignature;
        if (action !== 'ALISTO_PENDIENTES') {
            const resolvedDriverId = dto.driverId ?? (await this.prisma.order.findUnique({ where: { id }, select: { driverId: true } }))?.driverId ?? undefined;
            if (resolvedDriverId) {
                const driverRecord = await this.prisma.user.findUnique({
                    where: { id: resolvedDriverId },
                    select: { id: true, name: true, signature: true },
                });
                if (driverRecord) {
                    driverId = driverRecord.id;
                    driverName = driverRecord.name;
                    driverSignature = driverRecord.signature ?? undefined;
                }
            }
        }
        await this.prisma.orderHistory.create({
            data: {
                orderId: id,
                userId: user.sub,
                userName: actingName,
                action,
                ...(driverId && { driverId, driverName, driverSignature }),
            },
        });
        const orderWithHistory = await this.prisma.order.findUnique({
            where: { id },
            include: ORDER_LIST_INCLUDE,
        });
        this.ordersGateway.emitOrderUpdated(orderWithHistory);
        return orderWithHistory;
    }
    async getStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [todayOrders, pending, inProgress, completed, total] = await Promise.all([
            this.prisma.order.count({ where: { createdAt: { gte: today } } }),
            this.prisma.order.count({ where: { status: 'PENDING' } }),
            this.prisma.order.count({ where: { status: 'IN_PROGRESS' } }),
            this.prisma.order.count({ where: { status: 'COMPLETED' } }),
            this.prisma.order.count(),
        ]);
        return {
            todayOrders,
            pending,
            inProgress,
            completed,
            total,
        };
    }
    async deleteOrder(id, user) {
        const order = await this.prisma.order.findUnique({ where: { id } });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (user.role === client_1.Role.PROJECT && order.userId !== user.sub) {
            throw new common_1.ForbiddenException('You can only delete your own orders');
        }
        await this.prisma.order.delete({ where: { id } });
        return { message: 'Order deleted successfully' };
    }
    async getReports(filters) {
        const where = {};
        if (filters.projectId) {
            where.projectId = filters.projectId;
        }
        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate)
                where.createdAt.gte = new Date(filters.startDate);
            if (filters.endDate) {
                const end = new Date(filters.endDate);
                end.setHours(23, 59, 59, 999);
                where.createdAt.lte = end;
            }
        }
        const orders = await this.prisma.order.findMany({
            where,
            include: {
                project: true,
                user: { select: { id: true, name: true, email: true } },
                orderItems: { include: { product: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        const projectMap = {};
        for (const order of orders) {
            const key = order.projectId;
            if (!projectMap[key]) {
                projectMap[key] = {
                    projectId: key,
                    projectName: order.project.name,
                    orderCount: 0,
                    itemCount: 0,
                    products: {},
                };
            }
            projectMap[key].orderCount += 1;
            for (const item of order.orderItems) {
                projectMap[key].itemCount += item.quantity;
                const pk = item.product.id;
                if (!projectMap[key].products[pk]) {
                    projectMap[key].products[pk] = {
                        productId: pk,
                        code: item.product.code,
                        name: item.product.name,
                        totalQty: 0,
                    };
                }
                projectMap[key].products[pk].totalQty += item.quantity;
            }
        }
        const byProject = Object.values(projectMap).map((p) => ({
            projectId: p.projectId,
            projectName: p.projectName,
            orderCount: p.orderCount,
            itemCount: p.itemCount,
            topProducts: Object.values(p.products)
                .sort((a, b) => b.totalQty - a.totalQty)
                .slice(0, 10),
        })).sort((a, b) => b.orderCount - a.orderCount);
        const totalItems = orders.reduce((sum, o) => sum + o.orderItems.reduce((s, i) => s + i.quantity, 0), 0);
        return {
            totalOrders: orders.length,
            totalItems,
            byProject,
            orders,
        };
    }
    async addPhotos(orderId, dataUrls) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        await this.prisma.orderPhoto.createMany({
            data: dataUrls.map((dataUrl) => ({ orderId, dataUrl })),
        });
        return this.prisma.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE });
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        orders_gateway_1.OrdersGateway,
        notifications_service_1.NotificationsService,
        users_service_1.UsersService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map