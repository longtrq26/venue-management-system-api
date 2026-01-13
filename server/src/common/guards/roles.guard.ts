import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY, ROLES_KEY } from '../constants/common.constant';
import { Role } from '../enums/role.enum';
import { JwtPayload } from '../types/common.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // bypass role check if the route is Public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // get required roles defined by @Roles() decorator
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // if no specific roles are required, allow access to any authenticated user
    if (!requiredRoles) return true;

    // extract user from request (populated by AccessTokenGuard previously)
    const request = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    const user = request.user;

    // if for some reason user is missing (e.g., AuthGuard failed), deny access
    if (!user) return false;

    // admin users can access ALL routes, ignoring specific role requirements.
    if (user.role === Role.ADMIN) return true;

    // check if the user has the required role
    return requiredRoles.includes(user.role);
  }
}
