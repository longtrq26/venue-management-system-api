import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../constants/common.constant';
import { Role } from '../enums/role.enum';

// Decorator for roles
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
