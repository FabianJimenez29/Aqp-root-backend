import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class NotificationsController {
    private readonly notificationsService;
    private readonly prisma;
    constructor(notificationsService: NotificationsService, prisma: PrismaService);
    sendTestNotification(req: any): Promise<{
        success: boolean;
        message: string;
        token?: undefined;
    } | {
        success: boolean;
        message: string;
        token: string;
    }>;
}
