export type OrderStatus = "partially_completed" | "uncompleted" | "completed";

export interface OrderItem {
  itemId: string;
  itemName: string;
  stockCount: number;
  billedStockCount: number; // How much has been billed/fulfilled for this item
}

export interface Order {
  id: string;
  orderId: string;
  clientName: string;
  items: OrderItem[]; // Array of items in the order
  date: string;
  time: string;
  status: OrderStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

// Legacy interface for backward compatibility (single item orders)
export interface LegacyOrder {
  id: string;
  orderId: string;
  itemId: string;
  itemName: string;
  clientName: string;
  stockCount: number;
  date: string;
  time: string;
  status: OrderStatus;
  billedStockCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BillingItemData {
  itemId: string;
  billedStockCount: number;
  price: number;
}

export interface BillingData {
  items: BillingItemData[]; // Multiple items can be billed at once
}

export interface OrderFormData {
  clientName: string;
  items: OrderItem[]; // Always use items array
  status?: OrderStatus;
}

// For single item orders (backward compatibility)
export interface SingleOrderFormData {
  itemId: string;
  itemName: string;
  clientName: string;
  stockCount: number;
  status?: OrderStatus;
}

export interface MultiOrderFormData {
  clientName: string;
  items: Omit<OrderItem, "billedStockCount">[]; // Items without billedStockCount (will be set to 0)
}

