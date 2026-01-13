import { Role } from '../enums/role.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface JwtPayloadWithRefreshToken extends JwtPayload {
  refreshToken: string;
}

export interface JwtResponse {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}
