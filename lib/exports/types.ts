export interface SummaryByItem {
  itemId: string;
  itemName: string;
  totalStock: number;
}

export interface SummaryByClientItem {
  client: string;
  itemId: string;
  itemName: string;
  totalStock: number;
}

export interface ExportData {
  summaryByItem: SummaryByItem[];
  summaryByClientItem: SummaryByClientItem[];
  totalOrders: number;
}

