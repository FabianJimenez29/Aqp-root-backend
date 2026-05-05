"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor() {
        this.logger = new common_1.Logger(NotificationsService_1.name);
        this.EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
    }
    async sendPushNotification(tokens, title, body, data) {
        const tokenList = Array.isArray(tokens) ? tokens : [tokens];
        const validTokens = tokenList.filter((t) => t && t.startsWith('ExponentPushToken['));
        if (validTokens.length === 0) {
            this.logger.warn('[Push] No valid Expo tokens to send to');
            return;
        }
        const messages = validTokens.map((to) => ({
            to,
            title,
            body,
            sound: 'default',
            priority: 'high',
            data: data ?? {},
        }));
        const chunks = this.chunkArray(messages, 100);
        for (const chunk of chunks) {
            try {
                const response = await fetch(this.EXPO_PUSH_URL, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Accept-encoding': 'gzip, deflate',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(chunk),
                });
                const result = await response.json();
                result.data?.forEach((ticket, i) => {
                    if (ticket.status === 'error') {
                        this.logger.error(`[Push] Failed for token ${chunk[i]?.to}: ${ticket.message}`);
                    }
                });
                this.logger.log(`[Push] Sent ${chunk.length} notification(s): "${title}"`);
            }
            catch (err) {
                this.logger.error('[Push] Error calling Expo Push API:', err);
            }
        }
    }
    async sendNewOrderNotification(projectName, tokens, orderId) {
        await this.sendPushNotification(tokens, '📦 New Order', `${projectName} submitted a new order`, { screen: 'OrderDetail', orderId });
    }
    async sendOrderUpdatedNotification(token, orderStatus, orderId) {
        const statusLabel = {
            IN_PROGRESS: 'Your order is being prepared 🔄',
            COMPLETED: 'Your order is ready ✅',
        };
        const body = statusLabel[orderStatus] ?? 'Your order status has changed';
        await this.sendPushNotification(token, 'Order Update', body, {
            screen: 'OrderDetail',
            orderId,
        });
    }
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)()
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map