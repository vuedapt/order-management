export interface BillingEntry {
  id: string;
  orderId: string;
  orderOrderId: string;
  itemId: string;
  itemName: string;
  clientName: string;
  billedStockCount: number;
  price: number;
  totalAmount: number;
  date: string;
  time: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingFilters {
  itemId: string;
  itemName: string;
  clientName: string;
  orderOrderId: string;
  timeRange: string;
}

export interface PaginatedBillingEntries {
  billingEntries: BillingEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

