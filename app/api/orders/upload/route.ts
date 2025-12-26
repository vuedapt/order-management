import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/connect";
import Order from "@/models/Order";
import Stock from "@/models/Stock";
import { verifyToken } from "@/lib/auth/jwt";
import { generateNextOrderId } from "@/lib/utils/orderIdGenerator";
import { formatDateIST, formatTimeIST } from "@/lib/utils/dateTime";
import * as XLSX from "xlsx";

async function verifyAuth(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) {
    return null;
  }
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

// POST - Bulk upload orders from Excel
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
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

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Get the last order to generate order IDs
    const lastOrder = await Order.findOne({
      orderId: {
        $exists: true,
        $ne: null,
        $regex: /^[A-Z]{3}\d{3}$/,
        $not: /^TEMP-/,
      },
    })
      .sort({ orderId: -1 })
      .lean();
    const lastOrderId = lastOrder?.orderId || null;

    const currentDate = formatDateIST(new Date());
    const currentTime = formatTimeIST(new Date());

    const results = {
      success: [] as any[],
      errors: [] as any[],
    };

    let currentOrderId = lastOrderId;

    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      const itemId = String(row["Item ID"] || row["itemId"] || row["ItemID"] || "").trim();
      const itemName = String(row["Item Name"] || row["itemName"] || row["ItemName"] || "").trim();
      const clientName = String(row["Client Name"] || row["clientName"] || row["ClientName"] || "").trim();
      const stockCount = parseInt(row["Stock Count"] || row["stockCount"] || row["StockCount"] || 0);

      if (!itemId || !itemName || !clientName || stockCount === undefined) {
        results.errors.push({
          row: i + 2,
          error: "Item ID, Item Name, Client Name, and Stock Count are required",
        });
        continue;
      }

      try {
        // Check stock availability
        const stock = await Stock.findOne({ itemId });
        if (!stock) {
          results.errors.push({
            row: i + 2,
            itemId,
            error: `Item ${itemId} not found in stock`,
          });
          continue;
        }

        if (stock.stockCount < stockCount) {
          results.errors.push({
            row: i + 2,
            itemId,
            error: `Insufficient stock. Available: ${stock.stockCount}, Requested: ${stockCount}`,
          });
          continue;
        }

        // Generate order ID
        currentOrderId = generateNextOrderId(currentOrderId);

        // Create order
        const order = new Order({
          orderId: currentOrderId,
          itemId,
          itemName,
          clientName,
          stockCount,
          date: currentDate,
          time: currentTime,
        });

        await order.save();

        // Decrease stock
        stock.stockCount -= stockCount;
        await stock.save();

        results.success.push({
          row: i + 2,
          orderId: currentOrderId,
          itemId,
        });
      } catch (error: any) {
        results.errors.push({
          row: i + 2,
          itemId,
          error: error.message || "Failed to create order",
        });
      }
    }

    return NextResponse.json({
      message: `Processed ${data.length} rows`,
      success: results.success.length,
      errors: results.errors.length,
      details: results,
    });
  } catch (error: any) {
    console.error("Error uploading orders:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

