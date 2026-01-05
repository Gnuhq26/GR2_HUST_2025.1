import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Global JWT Authentication Guard
 * Automatically applied to all routes except those marked with @Public()
 * 
 * This guard extends JwtAuthGuard and adds support for public routes
 */
@Injectable()
export class GlobalJwtAuthGuard extends JwtAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true; // Allow access without authentication
    }

    // Otherwise, use standard JWT authentication
    const result = await super.canActivate(context);
    return result as boolean;
  }
}
