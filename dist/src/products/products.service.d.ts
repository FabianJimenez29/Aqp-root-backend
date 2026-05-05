import { PrismaService } from '../prisma/prisma.service';
export declare class ProductsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    importFromCsv(fileBuffer: Buffer): Promise<{
        imported: number;
        skipped: number;
    }>;
    findAll(category?: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        code: string;
        category: string;
    }[]>;
    search(query: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        code: string;
        category: string;
    }[]>;
    deleteAll(): Promise<{
        deleted: number;
    }>;
}
