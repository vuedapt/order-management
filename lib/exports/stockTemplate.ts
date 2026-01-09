import * as XLSX from "xlsx";

export function generateStockTemplate(): Buffer {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Create the template data
  const templateData = [
    // Header
    ["Stock Template"],
    [""], // Empty row
    // Stock details header
    ["Item ID", "Item Name", "Stock Count"],
    // Example rows (can be deleted by user)
    ["ITEM-001", "Example Item 1", 100],
    ["ITEM-002", "Example Item 2", 50],
    ["ITEM-003", "Example Item 3", 75],
  ];

  // Create worksheet from data
  const worksheet = XLSX.utils.aoa_to_sheet(templateData);

  // Set column widths
  worksheet["!cols"] = [
    { wch: 15 }, // Item ID column
    { wch: 30 }, // Item Name column
    { wch: 12 }, // Stock Count column
  ];

  // Add the worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, "Stock Template");

  // Generate Excel file buffer
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

