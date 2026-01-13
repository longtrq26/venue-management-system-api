import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { JwtPayloadWithRefreshToken } from '../types/common.type';

// Decorator to get current user from request
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayloadWithRefreshToken, context: ExecutionContext) => {
    // convert context to http to get request object
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: JwtPayloadWithRefreshToken }>();

    // get current user that passport strategy set in request
    const currentUser = request.user;

    // if no current user return null
    if (!currentUser) return null;

    // if no data return current user
    if (!data) return currentUser;

    // return current user data
    return currentUser[data];
  },
);
