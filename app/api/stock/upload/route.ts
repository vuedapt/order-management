import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/connect";
import Inventory from "@/models/Inventory";
import { authenticateRequest } from "@/lib/middleware/auth";
import * as XLSX from "xlsx";

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON - use first row as header
    const data = XLSX.utils.sheet_to_json(worksheet, {
      defval: "",
      raw: false,
      header: 1, // Use array format to better handle template structure
    }) as any[][];

    // Find the header row (look for "Item ID" or similar)
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(data.length, 10); i++) {
      const row = data[i];
      if (Array.isArray(row)) {
        const rowStr = row.map(cell => String(cell || "").toLowerCase()).join(" ");
        if (rowStr.includes("item") && (rowStr.includes("id") || rowStr.includes("name"))) {
          headerRowIndex = i;
          break;
        }
      }
    }

    if (headerRowIndex === -1) {
      return NextResponse.json(
        { error: "Could not find header row. Expected columns: Item ID, Item Name, Stock Count" },
        { status: 400 }
      );
    }

    // Get header row and normalize column indices
    const headerRow = data[headerRowIndex].map((cell: any) => String(cell || "").trim().toLowerCase());
    const itemIdIndex = headerRow.findIndex((h: string) => 
      h.includes("item") && h.includes("id")
    );
    const itemNameIndex = headerRow.findIndex((h: string) => 
      h.includes("item") && h.includes("name")
    );
    const stockCountIndex = headerRow.findIndex((h: string) => 
      h.includes("stock") && h.includes("count")
    );

    if (itemIdIndex === -1 || itemNameIndex === -1 || stockCountIndex === -1) {
      return NextResponse.json(
        { error: "Missing required columns. Expected: Item ID, Item Name, Stock Count" },
        { status: 400 }
      );
    }

    // Validate and process rows
    const errors: Array<{ row: number; error: string }> = [];
    const success: Array<any> = [];
    let successCount = 0;
    let errorCount = 0;

    // Process data rows (starting after header row)
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i];
      if (!Array.isArray(row) || row.length === 0) {
        continue;
      }

      const rowNumber = i + 1; // Excel row number (1-indexed)

      // Extract values using column indices
      const itemId = String(row[itemIdIndex] || "").trim();
      const itemName = String(row[itemNameIndex] || "").trim();
      const stockCount = String(row[stockCountIndex] || "").trim();

      // Skip empty rows
      if (!itemId && !itemName && !stockCount) {
        continue;
      }

      // Skip header-like rows
      if (
        itemId.toLowerCase().includes("item") && itemId.toLowerCase().includes("id") ||
        itemName.toLowerCase().includes("item") && itemName.toLowerCase().includes("name")
      ) {
        continue;
      }

      // Validate required fields
      if (!itemId || !itemName) {
        errors.push({
          row: rowNumber,
          error: "Item ID and Item Name are required",
        });
        errorCount++;
        continue;
      }

      // Validate stock count
      const stockCountNum = parseInt(String(stockCount)) || 0;
      if (isNaN(stockCountNum) || stockCountNum < 0) {
        errors.push({
          row: rowNumber,
          error: "Stock Count must be a valid non-negative number",
        });
        errorCount++;
        continue;
      }

      try {
        const trimmedItemId = String(itemId).trim();
        
        // First check if item exists (any status)
        const anyItem = await Inventory.findOne({ itemId: trimmedItemId });
        
        if (anyItem) {
          if (!anyItem.archived) {
            // Item exists and is not archived - ADD to stock count
            anyItem.itemName = String(itemName).trim();
            anyItem.stockCount = (anyItem.stockCount || 0) + stockCountNum;
            await anyItem.save();
            success.push({
              row: rowNumber,
              itemId: trimmedItemId,
              action: "stock_increased",
              previousStock: (anyItem.stockCount || 0) - stockCountNum,
              newStock: anyItem.stockCount,
            });
          } else {
            // Item exists but is archived - restore and set stock count
            anyItem.archived = false;
            anyItem.itemName = String(itemName).trim();
            anyItem.stockCount = stockCountNum;
            await anyItem.save();
            success.push({
              row: rowNumber,
              itemId: trimmedItemId,
              action: "restored",
            });
          }
        } else {
          // Item doesn't exist - create new item
          const inventory = new Inventory({
            itemId: trimmedItemId,
            itemName: String(itemName).trim(),
            stockCount: stockCountNum,
          });
          await inventory.save();
          success.push({
            row: rowNumber,
            itemId: trimmedItemId,
            action: "created",
          });
        }
        successCount++;
      } catch (dbError: any) {
        errors.push({
          row: rowNumber,
          error: dbError.message || "Database error",
        });
        errorCount++;
      }
    }

    return NextResponse.json({
      success: successCount,
      errors: errorCount,
      details: {
        success,
        errors,
      },
    });
  } catch (error: any) {
    console.error("Error uploading stock file:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}

