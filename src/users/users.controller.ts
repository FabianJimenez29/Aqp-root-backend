import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePushTokenDto } from './dto/update-push-token.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * POST /users
   * Creates a new user. Restricted to ADMIN role only.
   */
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  /**
   * GET /users
   * Returns all users. Restricted to ADMIN role.
   */
  @Roles(Role.ADMIN)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  /**
   * GET /users/drivers
   * Returns all users with DRIVER role. Accessible by ADMIN and WAREHOUSE.
   * Must be declared BEFORE GET :id to avoid route shadowing.
   */
  @Roles(Role.ADMIN, Role.WAREHOUSE)
  @Get('drivers')
  findDrivers() {
    return this.usersService.findDrivers();
  }

  /**
   * GET /users/:id
   * Returns a single user by ID.
   */
  @Roles(Role.ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  /**
   * PATCH /users/push-token
   * Saves the Expo Push Token for the authenticated user.
   * Called by the mobile app right after login (no role restriction – all users).
   */
  @Patch('push-token')
  updatePushToken(@Request() req, @Body() dto: UpdatePushTokenDto) {
    return this.usersService.updatePushToken(req.user.sub, dto);
  }

  /**
   * PATCH /users/:id/signature
   * Updates the stored signature for a user. ADMIN only.
   */
  @Roles(Role.ADMIN)
  @Patch(':id/signature')
  updateSignature(@Param('id') id: string, @Body('signature') signature: string) {
    return this.usersService.updateSignature(id, signature);
  }

  /**
   * PATCH /users/:id
   * Updates a user's profile. ADMIN only.
   */
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  /**
   * DELETE /users/:id
   * Deletes a user. ADMIN only. Cannot delete own account.
   */
  @Roles(Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  delete(@Param('id') id: string, @Request() req) {
    return this.usersService.delete(id, req.user.sub);
  }
}
