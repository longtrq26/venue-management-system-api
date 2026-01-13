import { Notification } from '../entities/notification.entity';

export interface PaginatedNotificationsResponse {
  notifications: Notification[];
  meta: {
    totalItems: number;
    currentPage: number;
    lastPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  unreadCount: number;
}
