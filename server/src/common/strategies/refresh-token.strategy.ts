import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload, JwtPayloadWithRefreshToken } from '../types/common.type';

interface RequestWithCookies extends Request {
  cookies: Record<string, string | undefined>;
}

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService) {
    super({
      // find refresh token from cookie
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: RequestWithCookies): string | null => {
          // If cookies exist and 'refresh_token' is present, return it.
          // Otherwise, return null (Passport will throw 401 automatically).
          return req?.cookies?.['refresh_token'] ?? null;
        },
      ]),
      secretOrKey: config.getOrThrow('jwt.refreshToken.secret'),
      passReqToCallback: true,
    });
  }

  // validate token only after verify signature and check expiration
  validate(req: RequestWithCookies, payload: JwtPayload): JwtPayloadWithRefreshToken {
    // retrieve the raw token string again from the cookie.
    // Note: We don't need to check if it exists here. If it didn't exist,
    // the extractor above would have failed, and this function wouldn't run.
    const refreshToken = req.cookies?.['refresh_token'];

    // return the payload combined with the raw refresh token.
    return {
      ...payload,
      refreshToken: refreshToken!,
    };
  }
}
