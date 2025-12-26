import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/connect";
import Stock from "@/models/Stock";
import { verifyToken } from "@/lib/auth/jwt";
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

// POST - Bulk upload stocks from Excel
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

    const results = {
      success: [] as any[],
      errors: [] as any[],
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      const itemId = String(row["Item ID"] || row["itemId"] || row["ItemID"] || "").trim();
      const itemName = String(row["Item Name"] || row["itemName"] || row["ItemName"] || "").trim();
      const stockCount = parseInt(row["Stock Count"] || row["stockCount"] || row["StockCount"] || 0);

      if (!itemId || !itemName) {
        results.errors.push({
          row: i + 2, // +2 because Excel rows start at 1 and we have a header
          error: "Item ID and Item Name are required",
        });
        continue;
      }

      try {
        // Check if stock item already exists
        const existingStock = await Stock.findOne({ itemId });
        if (existingStock) {
          // Update existing stock
          existingStock.itemName = itemName;
          existingStock.stockCount = stockCount;
          await existingStock.save();
          results.success.push({
            row: i + 2,
            itemId,
            action: "updated",
          });
        } else {
          // Create new stock
          const stock = new Stock({
            itemId,
            itemName,
            stockCount,
          });
          await stock.save();
          results.success.push({
            row: i + 2,
            itemId,
            action: "created",
          });
        }
      } catch (error: any) {
        results.errors.push({
          row: i + 2,
          itemId,
          error: error.message || "Failed to save stock item",
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
    console.error("Error uploading stocks:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

