import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/connect";
import Order from "@/models/Order";
import { authenticateRequest } from "@/lib/middleware/auth";
import * as XLSX from "xlsx";
import { generateOrderId } from "@/lib/utils/orderIdGenerator";
import { getCurrentDate, getCurrentTime } from "@/lib/utils/dateTime";

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

    // Convert to array of arrays to handle the specific template format
    const data = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
      raw: false,
    }) as any[][];

    // Debug: Log the parsed data
    console.log("Parsed Excel data:", JSON.stringify(data, null, 2));

    // Parse the template format:
    // Row 1: "Order Template" (title)
    // Row 2: Empty
    // Row 3: ["Client Name:", "value"]
    // Row 4: Empty
    // Row 5: ["Item ID", "Item Name", "Stock Count"] (header)
    // Row 6+: Data rows

    let clientName = "";
    const items: Array<{ itemId: string; itemName: string; stockCount: number }> = [];
    const errors: Array<{ row: number; error: string }> = [];
    let headerRowIndex = -1;

    // Find client name (row 3, column B) - index 2 (0-based)
    if (data.length > 2 && Array.isArray(data[2])) {
      const clientRow = data[2];
      console.log("Client row:", clientRow);
      if (clientRow.length > 1) {
        const firstCell = String(clientRow[0] || "").trim();
        if (firstCell === "Client Name:" || firstCell.toLowerCase().includes("client name")) {
          clientName = String(clientRow[1] || "").trim();
        }
      }
    }

    // Find header row (look for "Item ID" in first column)
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (Array.isArray(row) && row.length > 0) {
        const firstCell = String(row[0] || "").trim();
        if (firstCell === "Item ID" || firstCell.toLowerCase() === "item id") {
          headerRowIndex = i;
          break;
        }
      }
    }

    if (!clientName) {
      return NextResponse.json(
        { error: "Client Name is required. Please fill in the Client Name field in the template." },
        { status: 400 }
      );
    }

    if (headerRowIndex === -1) {
      return NextResponse.json(
        { error: "Could not find header row. Please ensure the template format is correct." },
        { status: 400 }
      );
    }

    // Process data rows (starting after header row)
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i];
      if (!Array.isArray(row) || row.length === 0) {
        continue;
      }

      // Skip empty rows
      const itemId = String(row[0] || "").trim();
      const itemName = String(row[1] || "").trim();
      const stockCountStr = String(row[2] || "").trim();

      if (!itemId && !itemName && !stockCountStr) {
        continue;
      }

      // Skip header-like rows
      if (
        itemId.toLowerCase().includes("item") && 
        itemId.toLowerCase().includes("id")
      ) {
        continue;
      }

      // Validate required fields
      if (!itemId || !itemName) {
        errors.push({
          row: i + 1,
          error: "Item ID and Item Name are required",
        });
        continue;
      }

      // Validate stock count
      const stockCountNum = parseInt(stockCountStr, 10);
      if (isNaN(stockCountNum) || stockCountNum < 0) {
        errors.push({
          row: i + 1,
          error: "Stock Count must be a valid non-negative number",
        });
        continue;
      }

      items.push({
        itemId,
        itemName,
        stockCount: stockCountNum,
      });
    }

    console.log("Parsed items:", JSON.stringify(items, null, 2));
    console.log("Client name:", clientName);

    if (items.length === 0) {
      return NextResponse.json(
        { error: "No valid items found in the file. Please add at least one item." },
        { status: 400 }
      );
    }

    // Create orders (one order per file with all items)
    const success: Array<any> = [];
    let successCount = 0;
    let errorCount = errors.length;

    try {
      // Validate and transform items to ensure they match the schema
      const orderItems = items
        .filter((item) => {
          // Ensure all required fields are present and valid
          const isValid =
            item &&
            item.itemId &&
            String(item.itemId).trim() !== "" &&
            item.itemName &&
            String(item.itemName).trim() !== "" &&
            (typeof item.stockCount === "number" || !isNaN(Number(item.stockCount))) &&
            Number(item.stockCount) >= 0;
          
          if (!isValid) {
            errors.push({
              row: 0,
              error: `Invalid item: ${JSON.stringify(item)}`,
            });
          }
          return isValid;
        })
        .map((item) => {
          const stockCount = typeof item.stockCount === "number" 
            ? item.stockCount 
            : Number(item.stockCount);
          
          return {
            itemId: String(item.itemId).trim(),
            itemName: String(item.itemName).trim(),
            stockCount: stockCount,
            billedStockCount: 0,
          };
        });

      if (orderItems.length === 0) {
        errorCount++;
        errors.push({
          row: 0,
          error: `No valid items after validation. Received ${items.length} items, but none passed validation.`,
        });
        throw new Error("No valid items after validation");
      }

      // Validate each item one more time before creating the order
      for (const item of orderItems) {
        if (!item.itemId || !item.itemName || typeof item.stockCount !== "number") {
          errorCount++;
          errors.push({
            row: 0,
            error: `Invalid item structure: ${JSON.stringify(item)}`,
          });
          throw new Error(`Invalid item structure: ${JSON.stringify(item)}`);
        }
      }

      // Generate order ID
      let orderId = await generateOrderId();
      
      // Check if order ID already exists (retry if needed)
      let existingOrder = await Order.findOne({ orderId });
      let attempts = 0;
      while (existingOrder && attempts < 10) {
        orderId = await generateOrderId();
        existingOrder = await Order.findOne({ orderId });
        attempts++;
      }

      console.log("Creating order with items:", JSON.stringify(orderItems, null, 2));
      console.log("Order data:", {
        orderId,
        clientName: String(clientName).trim(),
        itemsCount: orderItems.length,
        date: getCurrentDate(),
        time: getCurrentTime(),
      });

      // Create order
      const order = new Order({
        orderId,
        clientName: String(clientName).trim(),
        items: orderItems,
        date: getCurrentDate(),
        time: getCurrentTime(),
        status: "uncompleted",
      });

      // Validate before saving
      const validationError = order.validateSync();
      if (validationError) {
        console.error("Validation error:", validationError);
        throw validationError;
      }

      await order.save();
      
      console.log("Order created successfully:", order.orderId);

      success.push({
        orderId: order.orderId,
        clientName: order.clientName,
        itemsCount: orderItems.length,
      });
      successCount++;
    } catch (dbError: any) {
      errors.push({
        row: 0,
        error: dbError.message || "Database error",
      });
      errorCount++;
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
    console.error("Error uploading order file:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}

