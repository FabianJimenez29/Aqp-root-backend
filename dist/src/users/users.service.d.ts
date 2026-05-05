import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePushTokenDto } from './dto/update-push-token.dto';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateUserDto): Promise<{
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.Role;
        signature: string;
        createdAt: Date;
    }>;
    findAll(): Promise<{
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.Role;
        createdAt: Date;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.Role;
        createdAt: Date;
    }>;
    updatePushToken(userId: string, dto: UpdatePushTokenDto): Promise<{
        success: boolean;
    }>;
    getWarehousePushTokens(): Promise<string[]>;
    findDrivers(): Promise<{
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.Role;
        signature: string;
    }[]>;
    updateSignature(userId: string, signature: string): Promise<{
        success: boolean;
    }>;
    update(id: string, dto: UpdateUserDto): Promise<{
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.Role;
        signature: string;
        createdAt: Date;
    }>;
    delete(id: string, requestingUserId: string): Promise<{
        success: boolean;
    }>;
}
