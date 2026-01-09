import * as XLSX from "xlsx";

export function generateOrderTemplate(): Buffer {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Create the template data matching the upload format exactly
  const templateData = [
    // Row 1: Title
    ["Order Template"],
    // Row 2: Empty row
    [""],
    // Row 3: Client Name field (label in column A, value in column B)
    ["Client Name:", ""],
    // Row 4: Empty row
    [""],
    // Row 5: Header row for items
    ["Item ID", "Item Name", "Stock Count"],
    // Row 6+: Example data rows (can be deleted by user)
    ["ITEM-001", "Example Item 1", 10],
    ["ITEM-002", "Example Item 2", 20],
    ["ITEM-003", "Example Item 3", 15],
  ];

  // Create worksheet from data
  const worksheet = XLSX.utils.aoa_to_sheet(templateData);

  // Set column widths for better readability
  worksheet["!cols"] = [
    { wch: 15 }, // Column A: Client Name label / Item ID
    { wch: 30 }, // Column B: Client Name value / Item Name
    { wch: 12 }, // Column C: Stock Count
  ];

  // Add the worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, "Order Template");

  // Generate Excel file buffer
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

