import { ProductsService } from './products.service';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    importCsv(file: Express.Multer.File): Promise<{
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
