import { Injectable, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePushTokenDto } from './dto/update-push-token.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new user with a hashed password.
   * Only ADMIN can call this endpoint.
   */
  async create(dto: CreateUserDto) {
    // Prevent duplicate emails
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
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

  /**
   * Lists all users (without exposing passwords).
   */
  async findAll() {
    return this.prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Finds a single user by ID.
   */
  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
  }

  /**
   * Saves the Expo Push Token for a user after device registration.
   * Called automatically by the mobile app after login.
   */
  async updatePushToken(userId: string, dto: UpdatePushTokenDto) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { pushToken: dto.pushToken },
    });
    return { success: true };
  }

  /**
   * Returns all WAREHOUSE and ADMIN users that have a registered push token.
   * Used by NotificationsService to send new-order alerts.
   */
  async getWarehousePushTokens(): Promise<string[]> {
    const users = await this.prisma.user.findMany({
      where: { 
        role: { in: ['WAREHOUSE', 'ADMIN'] },
        pushToken: { not: null } 
      },
      select: { pushToken: true },
    });
    return users.map((u) => u.pushToken!);
  }

  async findDrivers() {
    return this.prisma.user.findMany({
      where: { role: 'DRIVER' },
      select: { id: true, name: true, email: true, role: true, signature: true },
      orderBy: { name: 'asc' },
    });
  }

  async updateSignature(userId: string, signature: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { signature },
    });
    return { success: true };
  }

  /**
   * Updates a user's profile. Only changed fields are applied.
   * Email uniqueness is validated before saving.
   */
  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const data: Record<string, any> = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.signature !== undefined) data.signature = dto.signature || null;

    if (dto.email !== undefined && dto.email !== user.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email, NOT: { id } },
      });
      if (existing) throw new ConflictException('Ese correo ya está en uso');
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

  /**
   * Deletes a user. Prevents self-deletion.
   * Fails with a clear message if the user has associated orders.
   */
  async delete(id: string, requestingUserId: string) {
    if (id === requestingUserId) {
      throw new ForbiddenException('No puedes eliminar tu propia cuenta');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    try {
      await this.prisma.user.delete({ where: { id } });
    } catch (err: any) {
      // Prisma FK constraint violation
      if (err?.code === 'P2003' || err?.code === 'P2014') {
        throw new ForbiddenException(
          'No se puede eliminar este usuario porque tiene pedidos asociados',
        );
      }
      throw err;
    }

    return { success: true };
  }
}
