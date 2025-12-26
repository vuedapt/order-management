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

// POST - Decrease stock for items
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { items } = body; // Array of { itemId, quantity }

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Items array is required" },
        { status: 400 }
      );
    }

    const results = [];

    for (const item of items) {
      const { itemId, quantity } = item;

      if (!itemId || quantity === undefined) {
        continue;
      }

      const stock = await Stock.findOne({ itemId });
      if (!stock) {
        results.push({
          itemId,
          success: false,
          error: "Item not found in stock",
        });
        continue;
      }

      if (stock.stockCount < quantity) {
        results.push({
          itemId,
          success: false,
          error: `Insufficient stock. Available: ${stock.stockCount}, Requested: ${quantity}`,
        });
        continue;
      }

      stock.stockCount -= quantity;
      await stock.save();

      results.push({
        itemId,
        success: true,
        newStockCount: stock.stockCount,
      });
    }

    // Check if all operations succeeded
    const allSucceeded = results.every((r) => r.success);
    if (!allSucceeded) {
      return NextResponse.json(
        {
          error: "Some stock decreases failed",
          results,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error: any) {
    console.error("Error decreasing stock:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

