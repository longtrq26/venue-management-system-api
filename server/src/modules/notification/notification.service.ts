import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationType } from 'src/common/enums/notification-type.enum';
import { LoggerService } from 'src/providers/logger/logger.service';
import { Repository } from 'typeorm';
import { NotificationListQueryDto } from './dtos/notification-list-query.dto';
import { Notification } from './entities/notification.entity';
import { PaginatedNotificationsResponse } from './types/notification.type';

@Injectable()
export class NotificationService {
  private readonly CONTEXT = NotificationService.name;

  constructor(
    private readonly logger: LoggerService,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {
    this.logger.log('NotificationService initialized with repository injection', this.CONTEXT);
  }

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    content: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const notification = this.notificationRepository.create({
      userId,
      type,
      title,
      content,
      metadata,
      isRead: false,
    });

    try {
      await this.notificationRepository.save(notification);

      this.logger.log(
        `Notification created successfully - User: ${userId}, Type: ${type}, Title: "${title}"`,
        this.CONTEXT,
      );
    } catch (error) {
      const errorMessage = `Failed to create notification for user ${userId} (${type}): ${
        error instanceof Error ? error.message : 'Unknown database error'
      }`;

      this.logger.error(
        errorMessage,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );

      throw error;
    }
  }

  async getNotificationList(
    userId: string,
    dto: NotificationListQueryDto,
  ): Promise<PaginatedNotificationsResponse> {
    const { page = 1, pageSize = 20 } = dto;
    const skip = (page - 1) * pageSize;

    const [notifications, total] = await this.notificationRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: pageSize,
      skip,
    });

    const unreadCount = await this.notificationRepository.count({
      where: { userId, isRead: false },
    });

    const meta = {
      totalItems: total,
      currentPage: page,
      lastPage: Math.ceil(total / pageSize),
      hasNextPage: page < Math.ceil(total / pageSize),
      hasPreviousPage: page > 1,
    };

    this.logger.debug(
      `Retrieved notifications for user ${userId} - Page: ${page}/${meta.lastPage}, Items: ${notifications.length}, Unread: ${unreadCount}`,
      this.CONTEXT,
    );

    return {
      notifications,
      meta,
      unreadCount,
    };
  }

  async markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    this.logger.debug(
      `Attempting to mark notification as read - User: ${userId}, Notification: ${notificationId}`,
      this.CONTEXT,
    );

    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      this.logger.warn(
        `Notification not found or access denied - User: ${userId}, Notification: ${notificationId}`,
        this.CONTEXT,
      );
      throw new NotFoundException('Notification not found');
    }

    if (!notification.isRead) {
      notification.isRead = true;

      try {
        await this.notificationRepository.save(notification);

        this.logger.log(
          `Notification marked as read - User: ${userId}, Notification: ${notificationId}, Type: ${notification.type}`,
          this.CONTEXT,
        );
      } catch (error) {
        const errorMessage = `Failed to mark notification as read - User: ${userId}, Notification: ${notificationId}: ${
          error instanceof Error ? error.message : 'Unknown database error'
        }`;

        this.logger.error(
          errorMessage,
          error instanceof Error ? error.stack : undefined,
          this.CONTEXT,
        );
        throw error;
      }
    } else {
      this.logger.debug(
        `Notification already marked as read - User: ${userId}, Notification: ${notificationId}`,
        this.CONTEXT,
      );
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      const result = await this.notificationRepository.update(
        { userId, isRead: false },
        { isRead: true },
      );

      this.logger.log(
        `Marked ${result.affected || 0} notifications as read for user ${userId}`,
        this.CONTEXT,
      );
    } catch (error) {
      const errorMessage = `Failed to mark all notifications as read for user ${userId}: ${
        error instanceof Error ? error.message : 'Unknown database error'
      }`;

      this.logger.error(
        errorMessage,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
  }
}
