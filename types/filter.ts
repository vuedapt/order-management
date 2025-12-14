export type TimeRange = "today" | "7d" | "1m" | "1y" | "all";

export interface OrderFilters {
  itemId: string;
  itemName: string;
  clientName: string;
  timeRange: TimeRange;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedOrders {
  orders: any[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

