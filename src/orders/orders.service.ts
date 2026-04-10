import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersGateway } from './orders.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderItemDto, UpdateOrderStatusDto } from './dto/update-order.dto';
import { Role, OrderStatus } from '@prisma/client';

// Shape of the authenticated user from JwtStrategy
interface AuthUser {
  sub: string;
  email: string;
  role: Role;
}

// Reusable include config for full order details (usado en findOne, updates, etc.)
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
    orderBy: { createdAt: 'asc' as const },
  },
  photos: {
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

// Include reducido para el listado — omite fotos y firma del driver (base64 pesados)
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
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersGateway: OrdersGateway,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Creates a new order with its items.
   * After creation, emits a "new_order" WebSocket event to warehouse clients.
   */
  async create(dto: CreateOrderDto, user: AuthUser) {
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

    // ── Real-time: notify all warehouse clients about the new order ──
    this.ordersGateway.emitNewOrder(order);

    // ── Push notification: alert warehouse users on their devices ──
    // Run async without blocking the HTTP response
    this.usersService.getWarehousePushTokens().then((tokens) => {
      if (tokens.length > 0) {
        this.notificationsService.sendNewOrderNotification(
          order.project.name,
          tokens,
          order.id,
        );
      }
    });

    return order;
  }

  /**
   * Returns all orders.
   * - WAREHOUSE and ADMIN see all orders.
   * - PROJECT users only see orders from their own projects (filtered by userId).
   */
  async findAll(user: AuthUser) {
    const where =
      user.role === Role.PROJECT ? { userId: user.sub } : undefined;

    return this.prisma.order.findMany({
      where,
      include: ORDER_LIST_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Returns a single order by ID.
   * By default returns lightweight payload; includeHeavy enables photos/signature.
   */
  async findOne(id: string, includeHeavy = false) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: includeHeavy ? ORDER_INCLUDE : ORDER_LIST_INCLUDE,
    });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    return order;
  }

  /**
   * Updates the status of an individual order item (e.g., PENDING → PREPARED).
   * Emits "order_updated" via WebSocket after update.
   * Order status moves to IN_PROGRESS (never auto-completes — user must press Enviar).
   */
  async updateItemStatus(
    orderId: string,
    itemId: string,
    dto: UpdateOrderItemDto,
    user: AuthUser,
  ) {
    // Only WAREHOUSE and ADMIN can update item statuses
    if (user.role === Role.PROJECT) {
      throw new ForbiddenException('Only warehouse staff can update item status');
    }

    // Verify item belongs to the given order
    const item = await this.prisma.orderItem.findFirst({
      where: { id: itemId, orderId },
    });
    if (!item) {
      throw new NotFoundException(`Item ${itemId} not found in order ${orderId}`);
    }

    await this.prisma.orderItem.update({
      where: { id: itemId },
      data: { status: dto.status },
    });

    // Update order to IN_PROGRESS as soon as any item is touched.
    // Never auto-complete — the user must press "Enviar Pedido" manually.
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'IN_PROGRESS',
        preparedById: user.sub,
      },
    });

    // Fetch final order without heavy base64 fields (fotos/firma) para respuesta rápida.
    // La pantalla de detalle ya tiene las fotos en memoria; solo necesita el estado actualizado.
    const finalOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: ORDER_LIST_INCLUDE,
    });

    // ── Real-time: notify relevant clients about the order update ──
    this.ordersGateway.emitOrderUpdated(finalOrder!);

    return finalOrder;
  }

  /**
   * Manually updates the overall order status (e.g., ADMIN can force-complete).
   * Accepts optional notes (e.g., list of pending items).
   * Records a history event: who acted, when, and what they did.
   */
  async updateOrderStatus(id: string, dto: UpdateOrderStatusDto, user: AuthUser) {
    if (user.role === Role.PROJECT) {
      throw new ForbiddenException('Project users cannot update order status');
    }

    // Determine if this is a re-completion (pending items being completed later)
    const existing = await this.prisma.order.findUnique({
      where: { id },
      select: { status: true },
    });
    const wasAlreadyCompleted = existing?.status === 'COMPLETED';
    const hasPendingNotes = dto.notes && dto.notes.trim() !== '';

    // Resolve the acting user's name for the history record
    const actingUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { name: true },
    });
    const actingName = actingUser?.name ?? user.email;

    // Determine action label
    let action: string;
    if (wasAlreadyCompleted) {
      action = 'ALISTO_PENDIENTES';
    } else if (hasPendingNotes) {
      action = 'ENVIO_CON_PENDIENTES';
    } else {
      action = 'ENVIO';
    }

    await this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status,
        // Track who completed the order
        ...(dto.status === 'COMPLETED' && { completedById: user.sub }),
        // Save driver if provided
        ...(dto.driverId && { driverId: dto.driverId }),
        // Empty string explicitly clears notes; real string saves it; undefined leaves unchanged
        ...(dto.notes !== undefined && { notes: dto.notes === '' ? null : dto.notes }),
      },
    });

    // Resolve driver snapshot for delivery events
    let driverId: string | undefined;
    let driverName: string | undefined;
    let driverSignature: string | undefined;

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

    // Record who did this action and when
    await this.prisma.orderHistory.create({
      data: {
        orderId: id,
        userId: user.sub,
        userName: actingName,
        action,
        ...(driverId && { driverId, driverName, driverSignature }),
      },
    });

    // Fetch updated order with new history entry.
    // Usamos ORDER_LIST_INCLUDE (sin fotos base64) para una respuesta HTTP liviana.
    // Las fotos se descargan explícitamente vía GET /orders/:id cuando se necesitan.
    const orderWithHistory = await this.prisma.order.findUnique({
      where: { id },
      include: ORDER_LIST_INCLUDE,
    });

    this.ordersGateway.emitOrderUpdated(orderWithHistory!);
    return orderWithHistory;
  }

  /**
   * Returns statistics for the dashboard.
   * - Total orders today
   * - Pending orders
   * - In progress orders
   * - Completed orders
   */
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

  /**
   * Deletes an order.
   * - ADMIN and WAREHOUSE can delete any order
   * - PROJECT can only delete their own orders
   */
  async deleteOrder(id: string, user: AuthUser) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // PROJECT users can only delete their own orders
    if (user.role === Role.PROJECT && order.userId !== user.sub) {
      throw new ForbiddenException('You can only delete your own orders');
    }

    await this.prisma.order.delete({ where: { id } });
    return { message: 'Order deleted successfully' };
  }

  /**
   * Returns aggregated order report for ADMIN.
   * Filters: projectId, startDate, endDate (ISO strings).
   * Returns: summary totals + per-project breakdown with top products + order list.
   */
  async getReports(filters: {
    projectId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: Record<string, any> = {};
    if (filters.projectId) {
      where.projectId = filters.projectId;
    }
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
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

    // Aggregate per project
    const projectMap: Record<string, {
      projectId: string;
      projectName: string;
      orderCount: number;
      itemCount: number;
      products: Record<string, { productId: string; code: string; name: string; totalQty: number }>;
    }> = {};

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

    const totalItems = orders.reduce(
      (sum, o) => sum + o.orderItems.reduce((s, i) => s + i.quantity, 0),
      0,
    );

    return {
      totalOrders: orders.length,
      totalItems,
      byProject,
      orders,
    };
  }

  /**
   * Saves an array of base64 photo data URLs as evidence for an order.
   */
  async addPhotos(orderId: string, dataUrls: string[]) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    await this.prisma.orderPhoto.createMany({
      data: dataUrls.map((dataUrl) => ({ orderId, dataUrl })),
    });
    return this.prisma.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE });
  }
}
