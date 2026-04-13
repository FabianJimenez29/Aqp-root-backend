import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ─── Body Size Limit ────────────────────────────────────────────────────
  // Aumentar límite para soportar imágenes de firma en base64 (PNG ≈ 1-3 MB)
  app.use(require('express').json({ limit: '10mb' }));
  app.use(require('express').urlencoded({ limit: '10mb', extended: true }));

  // ─── Global Validation ──────────────────────────────────────────────────
  // whitelist: strips unknown properties from DTOs
  // transform: auto-converts plain objects to DTO class instances
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // ─── CORS ───────────────────────────────────────────────────────────────
  // Allow requests from the mobile app (Expo) and any local dev tools
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ─── WebSocket Adapter ──────────────────────────────────────────────────
  // Replaces the default adapter with Socket.IO to support real-time events
  app.useWebSocketAdapter(new IoAdapter(app));

  // ─── Health check ───────────────────────────────────────────────────────
  // Simple GET /health endpoint para keep-alive (UptimeRobot, etc.)
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/health', (_req: any, res: any) => res.json({ status: 'ok' }));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`🚀 AQP Backend running on: http://localhost:${port}`);
  console.log(`📡 WebSocket gateway available on ws://localhost:${port}`);
}

bootstrap();
