import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { NotificationListQueryDto } from './dtos/notification-list-query.dto';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getNotificationList(
    @CurrentUser('sub') userId: string,
    @Query() dto: NotificationListQueryDto,
  ) {
    return this.notificationService.getNotificationList(userId, dto);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) notificationId: string,
  ) {
    await this.notificationService.markNotificationAsRead(userId, notificationId);
    return { message: 'Notification marked as read' };
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@CurrentUser('sub') userId: string) {
    await this.notificationService.markAllNotificationsAsRead(userId);
    return { message: 'All notifications marked as read' };
  }
}
