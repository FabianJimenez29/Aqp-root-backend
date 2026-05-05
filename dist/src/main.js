"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const platform_socket_io_1 = require("@nestjs/platform-socket.io");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use(require('express').json({ limit: '10mb' }));
    app.use(require('express').urlencoded({ limit: '10mb', extended: true }));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    app.enableCors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    app.useWebSocketAdapter(new platform_socket_io_1.IoAdapter(app));
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    console.log(`🚀 AQP Backend running on: http://localhost:${port}`);
    console.log(`📡 WebSocket gateway available on ws://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map