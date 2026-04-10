import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderItemDto, UpdateOrderStatusDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * POST /orders
   * Creates a new order. PROJECT users can only create orders for their projects.
   */
  @Post()
  create(@Body() dto: CreateOrderDto, @Request() req) {
    return this.ordersService.create(dto, req.user);
  }

  /**
   * GET /orders/reports
   * Returns aggregated report data. ADMIN only.
   * Query params: projectId?, startDate?, endDate? (ISO date strings)
   */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('reports')
  getReports(
    @Query('projectId') projectId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.ordersService.getReports({ projectId, startDate, endDate });
  }

  /**
   * GET /orders/stats
   * Returns order statistics for dashboard.
   * ADMIN and WAREHOUSE only.
   */
  @Get('stats')
  getStats() {
    return this.ordersService.getStats();
  }

  /**
   * GET /orders
   * Returns orders.
   * - WAREHOUSE/ADMIN: all orders
   * - PROJECT: only their own
   */
  @Get()
  findAll(@Request() req) {
    return this.ordersService.findAll(req.user);
  }

  /**
   * GET /orders/:id
   * Returns a single order.
   * - includeHeavy=true: includes base64-heavy relations (photos/signature)
   * - default: lightweight payload for faster screen loads
   */
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('includeHeavy') includeHeavy?: string,
  ) {
    return this.ordersService.findOne(id, includeHeavy === 'true');
  }

  /**
   * PATCH /orders/:orderId/items/:itemId
   * Marks an individual order item as PREPARED (or reverts to PENDING).
   * Warehouse staff only.
   */
  @UseGuards(RolesGuard)
  @Roles(Role.WAREHOUSE, Role.ADMIN)
  @Patch(':orderId/items/:itemId')
  updateItemStatus(
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateOrderItemDto,
    @Request() req,
  ) {
    return this.ordersService.updateItemStatus(orderId, itemId, dto, req.user);
  }

  /**
   * PATCH /orders/:id/status
   * Manually updates the overall order status.
   */
  @UseGuards(RolesGuard)
  @Roles(Role.WAREHOUSE, Role.ADMIN)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Request() req,
  ) {
    return this.ordersService.updateOrderStatus(id, dto, req.user);
  }

  /**
   * DELETE /orders/:id
   * Deletes an order.
   * ADMIN, WAREHOUSE, and PROJECT (own orders only) can delete.
   */
  @Delete(':id')
  delete(@Param('id') id: string, @Request() req) {
    return this.ordersService.deleteOrder(id, req.user);
  }

  /**
   * POST /orders/:id/photos
   * Saves photo evidence (base64 data URLs) for an order.
   */
  @Post(':id/photos')
  addPhotos(
    @Param('id') id: string,
    @Body('photos') photos: string[],
  ) {
    return this.ordersService.addPhotos(id, photos);
  }
}
