import { PrismaService } from '../prisma/prisma.service';
import { OrdersGateway } from './orders.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderItemDto, UpdateOrderStatusDto } from './dto/update-order.dto';
import { Role } from '@prisma/client';
interface AuthUser {
    sub: string;
    email: string;
    role: Role;
}
export declare class OrdersService {
    private readonly prisma;
    private readonly ordersGateway;
    private readonly notificationsService;
    private readonly usersService;
    constructor(prisma: PrismaService, ordersGateway: OrdersGateway, notificationsService: NotificationsService, usersService: UsersService);
    create(dto: CreateOrderDto, user: AuthUser): Promise<{
        project: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
        };
        user: {
            id: string;
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
        };
        preparedBy: {
            id: string;
            name: string;
            email: string;
        };
        completedBy: {
            id: string;
            name: string;
            email: string;
        };
        driver: {
            id: string;
            name: string;
            email: string;
            signature: string;
        };
        orderItems: ({
            product: {
                id: string;
                createdAt: Date;
                name: string;
                code: string;
                category: string;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.ItemStatus;
            quantity: number;
            productId: string;
            orderId: string;
        })[];
        history: {
            id: string;
            createdAt: Date;
            userId: string;
            driverId: string | null;
            orderId: string;
            userName: string;
            action: string;
            driverName: string | null;
            driverSignature: string | null;
        }[];
        photos: {
            id: string;
            createdAt: Date;
            orderId: string;
            dataUrl: string;
            caption: string | null;
        }[];
    } & {
        id: string;
        orderNumber: number;
        status: import(".prisma/client").$Enums.OrderStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        projectId: string;
        userId: string;
        preparedById: string | null;
        completedById: string | null;
        driverId: string | null;
    }>;
    findAll(user: AuthUser): Promise<({
        project: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
        };
        user: {
            id: string;
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
        };
        preparedBy: {
            id: string;
            name: string;
            email: string;
        };
        completedBy: {
            id: string;
            name: string;
            email: string;
        };
        driver: {
            id: string;
            name: string;
            email: string;
        };
        orderItems: ({
            product: {
                id: string;
                createdAt: Date;
                name: string;
                code: string;
                category: string;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.ItemStatus;
            quantity: number;
            productId: string;
            orderId: string;
        })[];
        history: {
            id: string;
            createdAt: Date;
            userId: string;
            driverId: string | null;
            orderId: string;
            userName: string;
            action: string;
            driverName: string | null;
            driverSignature: string | null;
        }[];
    } & {
        id: string;
        orderNumber: number;
        status: import(".prisma/client").$Enums.OrderStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        projectId: string;
        userId: string;
        preparedById: string | null;
        completedById: string | null;
        driverId: string | null;
    })[]>;
    findOne(id: string, includeHeavy?: boolean): Promise<{
        project: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
        };
        user: {
            id: string;
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
        };
        preparedBy: {
            id: string;
            name: string;
            email: string;
        };
        completedBy: {
            id: string;
            name: string;
            email: string;
        };
        driver: {
            id: string;
            name: string;
            email: string;
        };
        orderItems: ({
            product: {
                id: string;
                createdAt: Date;
                name: string;
                code: string;
                category: string;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.ItemStatus;
            quantity: number;
            productId: string;
            orderId: string;
        })[];
        history: {
            id: string;
            createdAt: Date;
            userId: string;
            driverId: string | null;
            orderId: string;
            userName: string;
            action: string;
            driverName: string | null;
            driverSignature: string | null;
        }[];
    } & {
        id: string;
        orderNumber: number;
        status: import(".prisma/client").$Enums.OrderStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        projectId: string;
        userId: string;
        preparedById: string | null;
        completedById: string | null;
        driverId: string | null;
    }>;
    updateItemStatus(orderId: string, itemId: string, dto: UpdateOrderItemDto, user: AuthUser): Promise<{
        project: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
        };
        user: {
            id: string;
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
        };
        preparedBy: {
            id: string;
            name: string;
            email: string;
        };
        completedBy: {
            id: string;
            name: string;
            email: string;
        };
        driver: {
            id: string;
            name: string;
            email: string;
        };
        orderItems: ({
            product: {
                id: string;
                createdAt: Date;
                name: string;
                code: string;
                category: string;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.ItemStatus;
            quantity: number;
            productId: string;
            orderId: string;
        })[];
        history: {
            id: string;
            createdAt: Date;
            userId: string;
            driverId: string | null;
            orderId: string;
            userName: string;
            action: string;
            driverName: string | null;
            driverSignature: string | null;
        }[];
    } & {
        id: string;
        orderNumber: number;
        status: import(".prisma/client").$Enums.OrderStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        projectId: string;
        userId: string;
        preparedById: string | null;
        completedById: string | null;
        driverId: string | null;
    }>;
    updateOrderStatus(id: string, dto: UpdateOrderStatusDto, user: AuthUser): Promise<{
        project: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
        };
        user: {
            id: string;
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
        };
        preparedBy: {
            id: string;
            name: string;
            email: string;
        };
        completedBy: {
            id: string;
            name: string;
            email: string;
        };
        driver: {
            id: string;
            name: string;
            email: string;
        };
        orderItems: ({
            product: {
                id: string;
                createdAt: Date;
                name: string;
                code: string;
                category: string;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.ItemStatus;
            quantity: number;
            productId: string;
            orderId: string;
        })[];
        history: {
            id: string;
            createdAt: Date;
            userId: string;
            driverId: string | null;
            orderId: string;
            userName: string;
            action: string;
            driverName: string | null;
            driverSignature: string | null;
        }[];
    } & {
        id: string;
        orderNumber: number;
        status: import(".prisma/client").$Enums.OrderStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        projectId: string;
        userId: string;
        preparedById: string | null;
        completedById: string | null;
        driverId: string | null;
    }>;
    getStats(): Promise<{
        todayOrders: number;
        pending: number;
        inProgress: number;
        completed: number;
        total: number;
    }>;
    deleteOrder(id: string, user: AuthUser): Promise<{
        message: string;
    }>;
    getReports(filters: {
        projectId?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<{
        totalOrders: number;
        totalItems: number;
        byProject: {
            projectId: string;
            projectName: string;
            orderCount: number;
            itemCount: number;
            topProducts: {
                productId: string;
                code: string;
                name: string;
                totalQty: number;
            }[];
        }[];
        orders: ({
            project: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
            };
            user: {
                id: string;
                name: string;
                email: string;
            };
            orderItems: ({
                product: {
                    id: string;
                    createdAt: Date;
                    name: string;
                    code: string;
                    category: string;
                };
            } & {
                id: string;
                status: import(".prisma/client").$Enums.ItemStatus;
                quantity: number;
                productId: string;
                orderId: string;
            })[];
        } & {
            id: string;
            orderNumber: number;
            status: import(".prisma/client").$Enums.OrderStatus;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            projectId: string;
            userId: string;
            preparedById: string | null;
            completedById: string | null;
            driverId: string | null;
        })[];
    }>;
    addPhotos(orderId: string, dataUrls: string[]): Promise<{
        project: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
        };
        user: {
            id: string;
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
        };
        preparedBy: {
            id: string;
            name: string;
            email: string;
        };
        completedBy: {
            id: string;
            name: string;
            email: string;
        };
        driver: {
            id: string;
            name: string;
            email: string;
            signature: string;
        };
        orderItems: ({
            product: {
                id: string;
                createdAt: Date;
                name: string;
                code: string;
                category: string;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.ItemStatus;
            quantity: number;
            productId: string;
            orderId: string;
        })[];
        history: {
            id: string;
            createdAt: Date;
            userId: string;
            driverId: string | null;
            orderId: string;
            userName: string;
            action: string;
            driverName: string | null;
            driverSignature: string | null;
        }[];
        photos: {
            id: string;
            createdAt: Date;
            orderId: string;
            dataUrl: string;
            caption: string | null;
        }[];
    } & {
        id: string;
        orderNumber: number;
        status: import(".prisma/client").$Enums.OrderStatus;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        projectId: string;
        userId: string;
        preparedById: string | null;
        completedById: string | null;
        driverId: string | null;
    }>;
}
export {};
