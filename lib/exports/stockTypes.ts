export interface StockSummaryItem {
  itemId: string;
  itemName: string;
  stockCount: number;
}

export interface StockExportData {
  stocks: StockSummaryItem[];
  totalItems: number;
  totalStockCount: number;
}

