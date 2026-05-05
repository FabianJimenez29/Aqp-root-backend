export declare class NotificationsService {
    private readonly logger;
    private readonly EXPO_PUSH_URL;
    sendPushNotification(tokens: string | string[], title: string, body: string, data?: Record<string, unknown>): Promise<void>;
    sendNewOrderNotification(projectName: string, tokens: string[], orderId: string): Promise<void>;
    sendOrderUpdatedNotification(token: string, orderStatus: string, orderId: string): Promise<void>;
    private chunkArray;
}
