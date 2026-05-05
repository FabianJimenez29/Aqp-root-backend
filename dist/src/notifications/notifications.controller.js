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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const notifications_service_1 = require("./notifications.service");
const prisma_service_1 = require("../prisma/prisma.service");
let NotificationsController = class NotificationsController {
    constructor(notificationsService, prisma) {
        this.notificationsService = notificationsService;
        this.prisma = prisma;
    }
    async sendTestNotification(req) {
        const userId = req.user.sub;
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { pushToken: true, name: true },
        });
        if (!user?.pushToken) {
            return {
                success: false,
                message: 'No push token found. Make sure you have logged in on the mobile app.',
            };
        }
        await this.notificationsService.sendPushNotification(user.pushToken, '🎉 Test Notification', `Hello ${user.name}! Your notifications are working correctly.`, { test: true });
        return {
            success: true,
            message: 'Test notification sent!',
            token: user.pushToken,
        };
    }
};
exports.NotificationsController = NotificationsController;
__decorate([
    (0, common_1.Post)('test'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "sendTestNotification", null);
exports.NotificationsController = NotificationsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('notifications'),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService,
        prisma_service_1.PrismaService])
], NotificationsController);
//# sourceMappingURL=notifications.controller.js.map