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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existing) {
            throw new common_1.ConflictException('A user with this email already exists');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                name: dto.name,
                email: dto.email,
                password: hashedPassword,
                role: dto.role,
                ...(dto.signature && { signature: dto.signature }),
            },
            select: { id: true, name: true, email: true, role: true, signature: true, createdAt: true },
        });
        return user;
    }
    async findAll() {
        return this.prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        return this.prisma.user.findUnique({
            where: { id },
            select: { id: true, name: true, email: true, role: true, createdAt: true },
        });
    }
    async updatePushToken(userId, dto) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { pushToken: dto.pushToken },
        });
        return { success: true };
    }
    async getWarehousePushTokens() {
        const users = await this.prisma.user.findMany({
            where: {
                role: { in: ['WAREHOUSE', 'ADMIN'] },
                pushToken: { not: null }
            },
            select: { pushToken: true },
        });
        return users.map((u) => u.pushToken);
    }
    async findDrivers() {
        return this.prisma.user.findMany({
            where: { role: 'DRIVER' },
            select: { id: true, name: true, email: true, role: true, signature: true },
            orderBy: { name: 'asc' },
        });
    }
    async updateSignature(userId, signature) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { signature },
        });
        return { success: true };
    }
    async update(id, dto) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('Usuario no encontrado');
        const data = {};
        if (dto.name !== undefined)
            data.name = dto.name;
        if (dto.role !== undefined)
            data.role = dto.role;
        if (dto.signature !== undefined)
            data.signature = dto.signature || null;
        if (dto.email !== undefined && dto.email !== user.email) {
            const existing = await this.prisma.user.findFirst({
                where: { email: dto.email, NOT: { id } },
            });
            if (existing)
                throw new common_1.ConflictException('Ese correo ya está en uso');
            data.email = dto.email;
        }
        if (dto.password) {
            data.password = await bcrypt.hash(dto.password, 10);
        }
        return this.prisma.user.update({
            where: { id },
            data,
            select: { id: true, name: true, email: true, role: true, signature: true, createdAt: true },
        });
    }
    async delete(id, requestingUserId) {
        if (id === requestingUserId) {
            throw new common_1.ForbiddenException('No puedes eliminar tu propia cuenta');
        }
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('Usuario no encontrado');
        try {
            await this.prisma.user.delete({ where: { id } });
        }
        catch (err) {
            if (err?.code === 'P2003' || err?.code === 'P2014') {
                throw new common_1.ForbiddenException('No se puede eliminar este usuario porque tiene pedidos asociados');
            }
            throw err;
        }
        return { success: true };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map