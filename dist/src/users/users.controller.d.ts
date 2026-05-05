import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePushTokenDto } from './dto/update-push-token.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
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
    findDrivers(): Promise<{
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.Role;
        signature: string;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.Role;
        createdAt: Date;
    }>;
    updatePushToken(req: any, dto: UpdatePushTokenDto): Promise<{
        success: boolean;
    }>;
    updateSignature(id: string, signature: string): Promise<{
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
    delete(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
