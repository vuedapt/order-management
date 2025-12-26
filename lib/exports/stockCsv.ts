import { StockExportData } from "./stockTypes";

function escapeCSVField(field: string | number): string {
  const str = String(field);
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportStockToCSV(data: StockExportData): void {
  const { stocks, totalItems, totalStockCount } = data;
  
  const csvRows: string[] = [];
  
  // Add UTF-8 BOM for Excel compatibility
  const BOM = "\uFEFF";
  
  // Header
  csvRows.push("Stock Summary Report");
  csvRows.push(`Generated: ${new Date().toLocaleString()}`);
  csvRows.push(`Total Items: ${totalItems}`);
  csvRows.push(`Total Stock Count: ${totalStockCount}`);
  csvRows.push("");
  
  // Stock data
  csvRows.push("Item ID,Item Name,Stock Count");
  stocks.forEach((stock) => {
    csvRows.push(`${escapeCSVField(stock.itemId)},${escapeCSVField(stock.itemName)},${stock.stockCount}`);
  });
  
  const csvContent = BOM + csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "stock-summary.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

