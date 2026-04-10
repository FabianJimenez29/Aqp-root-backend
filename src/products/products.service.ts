import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parse } from 'csv-parse/sync';

interface CsvProductRow {
  id?: string;
  name: string;
  category: string;
  code: string;
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Parses a CSV buffer and upserts products into the database.
   * Expected CSV headers: name, category, code
   * Upsert logic: if a product with the same `code` exists, it is updated.
   */
  async importFromCsv(fileBuffer: Buffer): Promise<{ imported: number; skipped: number }> {
    let records: CsvProductRow[];

    try {
      records = parse(fileBuffer, {
        columns: true,        // Use first row as column names
        skip_empty_lines: true,
        trim: true,
      }) as CsvProductRow[];
    } catch {
      throw new BadRequestException('Invalid CSV format. Ensure headers: name, category, code');
    }

    if (!records.length) {
      throw new BadRequestException('CSV file is empty');
    }

    let imported = 0;
    let skipped = 0;

    for (const row of records) {
      // Validate required fields
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

  /**
   * Returns all products optionally filtered by category.
   */
  async findAll(category?: string) {
    return this.prisma.product.findMany({
      where: category ? { category } : undefined,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * Full-text search on products by name or code.
   */
  async search(query: string) {
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

  /**
   * Deletes all products from the database.
   */
  async deleteAll() {
    const result = await this.prisma.product.deleteMany({});
    return { deleted: result.count };
  }
}
