import { Court } from '../entities/court.entity';

export type PaginatedCourtsResponse = {
  courts: Court[];
  meta: {
    totalItems: number;
    currentPage: number;
    lastPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};
