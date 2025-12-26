import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/connect";
import Stock from "@/models/Stock";
import { verifyToken } from "@/lib/auth/jwt";

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

// GET - Get stock summary data
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId") || "";
    const itemName = searchParams.get("itemName") || "";

    // Build filter query
    const filter: any = {};
    
    if (itemId.trim()) {
      filter.itemId = { $regex: itemId.trim(), $options: "i" };
    }
    
    if (itemName.trim()) {
      filter.itemName = { $regex: itemName.trim(), $options: "i" };
    }

    // Get all stock items matching filters
    const stocks = await Stock.find(filter).sort({ itemName: 1 }).lean();

    // Calculate totals
    const totalStockCount = stocks.reduce((sum, stock: any) => sum + (stock.stockCount || 0), 0);

    return NextResponse.json({
      stocks: stocks.map((stock: any) => ({
        itemId: stock.itemId,
        itemName: stock.itemName,
        stockCount: stock.stockCount,
      })),
      totalItems: stocks.length,
      totalStockCount,
    });
  } catch (error: any) {
    console.error("Error fetching stock summary:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

