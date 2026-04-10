import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAuthGuard – applies the JWT Passport strategy to any route.
 * Attach with @UseGuards(JwtAuthGuard) on controller or individual route.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
