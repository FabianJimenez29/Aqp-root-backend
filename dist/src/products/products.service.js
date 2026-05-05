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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const sync_1 = require("csv-parse/sync");
let ProductsService = class ProductsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async importFromCsv(fileBuffer) {
        let records;
        try {
            records = (0, sync_1.parse)(fileBuffer, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
            });
        }
        catch {
            throw new common_1.BadRequestException('Invalid CSV format. Ensure headers: name, category, code');
        }
        if (!records.length) {
            throw new common_1.BadRequestException('CSV file is empty');
        }
        let imported = 0;
        let skipped = 0;
        for (const row of records) {
            if (!row.code || !row.name || !row.category) {
                skipped++;
                continue;
            }
            await this.prisma.product.upsert({
                where: { code: row.code },
                update: { name: row.name, category: row.category },
                create: { code: row.code, name: row.name, category: row.category },
            });
            imported++;
        }
        return { imported, skipped };
    }
    async findAll(category) {
        return this.prisma.product.findMany({
            where: category ? { category } : undefined,
            orderBy: [{ category: 'asc' }, { name: 'asc' }],
        });
    }
    async search(query) {
        return this.prisma.product.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { code: { contains: query, mode: 'insensitive' } },
                    { category: { contains: query, mode: 'insensitive' } },
                ],
            },
            take: 50,
        });
    }
    async deleteAll() {
        const result = await this.prisma.product.deleteMany({});
        return { deleted: result.count };
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map