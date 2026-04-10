import {
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * POST /products/import
   * Imports products from a CSV file upload.
   * CSV must have columns: name, category, code
   * Restricted to ADMIN only.
   */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', {
      // Only allow CSV files (MIME type validation)
      fileFilter: (_, file, callback) => {
        if (!file.mimetype.includes('csv') && !file.originalname.endsWith('.csv')) {
          return callback(new Error('Only CSV files are allowed'), false);
        }
        callback(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
    }),
  )
  importCsv(@UploadedFile() file: Express.Multer.File) {
    return this.productsService.importFromCsv(file.buffer);
  }

  /**
   * GET /products
   * Lists all products. Optionally filter by ?category=
   */
  @Get()
  findAll(@Query('category') category?: string) {
    return this.productsService.findAll(category);
  }

  /**
   * GET /products/search?q=query
   * Searches products by name, code, or category.
   */
  @Get('search')
  search(@Query('q') query: string) {
    return this.productsService.search(query ?? '');
  }

  /**
   * DELETE /products
   * Deletes all products. Restricted to ADMIN only.
   */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete()
  deleteAll() {
    return this.productsService.deleteAll();
  }
}
