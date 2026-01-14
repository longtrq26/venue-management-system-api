import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserListQueryDto } from './dtos/user-list-query.dto';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // customer
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  async getUserProfile(@CurrentUser('sub') userId: string) {
    return this.userService.getUserById(userId);
  }

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  async updateUser(@CurrentUser('sub') userId: string, @Body() dto: UpdateUserDto) {
    return this.userService.updateUser(userId, dto);
  }

  // admin/manager
  @Get()
  @Roles(Role.ADMIN, Role.MANAGER)
  @HttpCode(HttpStatus.OK)
  async getUserList(@Query() query: UserListQueryDto) {
    return this.userService.getUserList(query);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('id', ParseUUIDPipe) userId: string) {
    await this.userService.deleteUser(userId);
    return { message: 'User deleted successfully' };
  }

  @Patch(':id/restore')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async restoreUser(@Param('id', ParseUUIDPipe) userId: string) {
    await this.userService.restoreUser(userId);
    return { message: 'User restored successfully' };
  }
}
