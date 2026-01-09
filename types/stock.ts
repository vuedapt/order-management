export interface StockItem {
  id: string;
  itemId: string;
  itemName: string;
  stockCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StockFormData {
  itemId: string;
  itemName: string;
  stockCount: number;
}

export interface StockFilters {
  itemId: string;
  itemName: string;
}

