import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../constants/common.constant';

// Decorator to mark a route as public
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
