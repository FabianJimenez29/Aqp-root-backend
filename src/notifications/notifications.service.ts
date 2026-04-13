/**
 * NotificationsService – Expo Push Notifications
 *
 * Sends push notifications via the Expo Push API (https://exp.host/--/api/v2/push/send).
 * This approach works for both iOS and Android without requiring Firebase Admin SDK
 * or any native configuration. Tokens are obtained from the mobile app via expo-notifications.
 *
 * To send FCM directly in the future, replace the fetch call with firebase-admin.
 */
import { Injectable, Logger } from '@nestjs/common';
import * as https from 'https';

// Agente HTTPS con keep-alive para reusar conexiones TCP hacia Expo Push API
// Evita el overhead de TLS handshake en cada notificación (~100-300ms)
const keepAliveAgent = new https.Agent({ keepAlive: true, maxSockets: 10 });

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  sound?: 'default';
  data?: Record<string, unknown>;
  priority?: 'default' | 'normal' | 'high';
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

  /**
   * Sends a push notification to one or multiple Expo Push Tokens.
   * Expo accepts up to 100 tokens per request (chunking handled automatically).
   */
  async sendPushNotification(
    tokens: string | string[],
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    const tokenList = Array.isArray(tokens) ? tokens : [tokens];

    // Filter out invalid tokens (Expo tokens start with "ExponentPushToken[")
    const validTokens = tokenList.filter(
      (t) => t && t.startsWith('ExponentPushToken['),
    );

    if (validTokens.length === 0) {
      this.logger.warn('[Push] No valid Expo tokens to send to');
      return;
    }

    // Build the message payload for each token
    const messages: ExpoPushMessage[] = validTokens.map((to) => ({
      to,
      title,
      body,
      sound: 'default',
      priority: 'high',
      data: data ?? {},
    }));

    // Send in chunks of 100 (Expo's limit per request)
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
          // @ts-ignore — Node 18+ fetch acepta agent para reusar conexiones
          agent: keepAliveAgent,
        });

        const result = await response.json() as { data: ExpoPushTicket[] };

        // Log any per-ticket errors
        result.data?.forEach((ticket, i) => {
          if (ticket.status === 'error') {
            this.logger.error(
              `[Push] Failed for token ${chunk[i]?.to}: ${ticket.message}`,
            );
          }
        });

        this.logger.log(
          `[Push] Sent ${chunk.length} notification(s): "${title}"`,
        );
      } catch (err) {
        this.logger.error('[Push] Error calling Expo Push API:', err);
      }
    }
  }

  /**
   * Sends a "new order" notification to all warehouse users.
   * Called from OrdersService after order creation.
   *
   * @param projectName  Name of the project that created the order
   * @param tokens       Push tokens of all WAREHOUSE users
   * @param orderId      ID of the new order (for deep-link navigation)
   */
  async sendNewOrderNotification(
    projectName: string,
    tokens: string[],
    orderId: string,
  ): Promise<void> {
    await this.sendPushNotification(
      tokens,
      '📦 New Order',
      `${projectName} submitted a new order`,
      { screen: 'OrderDetail', orderId },
    );
  }

  /**
   * Sends an "order updated" notification.
   * Can be used to alert the PROJECT user that their order is being processed.
   */
  async sendOrderUpdatedNotification(
    token: string,
    orderStatus: string,
    orderId: string,
  ): Promise<void> {
    const statusLabel: Record<string, string> = {
      IN_PROGRESS: 'Your order is being prepared 🔄',
      COMPLETED: 'Your order is ready ✅',
    };

    const body = statusLabel[orderStatus] ?? 'Your order status has changed';

    await this.sendPushNotification(token, 'Order Update', body, {
      screen: 'OrderDetail',
      orderId,
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
