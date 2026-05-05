import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    login(dto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
        };
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.Role;
        createdAt: Date;
    }>;
}
