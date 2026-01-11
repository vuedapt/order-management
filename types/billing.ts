export interface BillingEntry {
  id: string;
  billId: string;
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

export interface BillingBill {
  billId: string;
  orderOrderId: string;
  clientName: string;
  date: string;
  time: string;
  totalAmount: number;
  items: BillingEntry[];
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

export interface PaginatedBillingBills {
  bills: BillingBill[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Legacy interface for backward compatibility
export interface PaginatedBillingEntries {
  billingEntries: BillingEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

