import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../types/common.type';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(config: ConfigService) {
    super({
      // find token from header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // secret key for verify signature
      secretOrKey: config.getOrThrow('jwt.accessToken.secret'),

      // ensure token is not expired
      ignoreExpiration: false,
    });
  }

  // validate token only after verify signature and check expiration
  validate(payload: JwtPayload) {
    return payload;
  }
}
