import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * POST /notifications/test
   * Sends a test notification to the authenticated user.
   * Useful for debugging push notification setup.
   */
  @Post('test')
  async sendTestNotification(@Request() req) {
    const userId = req.user.sub;

    // Get the user's push token
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

    // Send test notification
    await this.notificationsService.sendPushNotification(
      user.pushToken,
      '🎉 Test Notification',
      `Hello ${user.name}! Your notifications are working correctly.`,
      { test: true },
    );

    return {
      success: true,
      message: 'Test notification sent!',
      token: user.pushToken,
    };
  }
}
