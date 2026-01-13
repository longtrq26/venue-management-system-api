import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../constants/common.constant';

@Injectable()
export class AccessTokenGuard extends AuthGuard('jwt-access') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // check for @Public() decorator on the handler (method) or class (controller)
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // if the route is marked as public, return true
    if (isPublic) return true;

    // if the route is not marked as public, return to AuthGuard to check for valid token
    return super.canActivate(context);
  }
}
