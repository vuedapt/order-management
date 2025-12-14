import { ExportData } from "./types";

function escapeCSVField(field: string | number): string {
  const str = String(field);
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToExcel(data: ExportData): void {
  const { summaryByItem, summaryByClientItem } = data;
  
  // For Excel, we'll create a CSV with proper formatting
  // In a real app, you'd use a library like xlsx
  const csvRows: string[] = [];
  
  csvRows.push("Summary by Item");
  csvRows.push("Item ID,Item Name,Total Stock");
  summaryByItem.forEach((row) => {
    csvRows.push(`${escapeCSVField(row.itemId)},${escapeCSVField(row.itemName)},${row.totalStock}`);
  });
  csvRows.push("");
  csvRows.push("Summary by Client and Item");
  csvRows.push("Client,Item ID,Item Name,Total Stock");
  summaryByClientItem.forEach((row) => {
    csvRows.push(`${escapeCSVField(row.client)},${escapeCSVField(row.itemId)},${escapeCSVField(row.itemName)},${row.totalStock}`);
  });
  
  const csvContent = csvRows.join("\n");
  // Add UTF-8 BOM for Excel compatibility
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `order-summary-${new Date().toISOString().split("T")[0]}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

