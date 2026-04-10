import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * @Roles decorator – marks a route with the required roles.
 *
 * Example:
 *   @Roles(Role.ADMIN)
 *   @Post('projects')
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
