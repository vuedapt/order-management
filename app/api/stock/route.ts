import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/connect";
import Inventory from "@/models/Inventory";
import { authenticateRequest } from "@/lib/middleware/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const itemId = searchParams.get("itemId") || "";
    const itemName = searchParams.get("itemName") || "";

    // Build query - exclude archived data
    const query: any = { archived: false };

    if (itemId) {
      query.itemId = { $regex: itemId, $options: "i" };
    }

    if (itemName) {
      query.itemName = { $regex: itemName, $options: "i" };
    }

    // Get total count
    const total = await Inventory.countDocuments(query);

    // Get paginated results
    const skip = (page - 1) * pageSize;
    const stocks = await Inventory.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    // Transform to match frontend format
    const transformedStocks = stocks.map((stock: any) => ({
      id: stock._id.toString(),
      itemId: stock.itemId,
      itemName: stock.itemName,
      stockCount: stock.stockCount,
      createdAt: stock.createdAt,
      updatedAt: stock.updatedAt,
    }));

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      stocks: transformedStocks,
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error: any) {
    console.error("Get stocks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stocks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { itemId, itemName, stockCount } = body;

    if (!itemId || !itemName || stockCount === undefined) {
      return NextResponse.json(
        { error: "itemId, itemName, and stockCount are required" },
        { status: 400 }
      );
    }

    // Check if item already exists (excluding archived items)
    const existing = await Inventory.findOne({ itemId, archived: false });
    if (existing) {
      return NextResponse.json(
        { error: "Item with this ID already exists" },
        { status: 400 }
      );
    }

    const inventory = new Inventory({
      itemId,
      itemName,
      stockCount: parseInt(stockCount) || 0,
    });

    await inventory.save();

    const transformedStock = {
      id: inventory._id.toString(),
      itemId: inventory.itemId,
      itemName: inventory.itemName,
      stockCount: inventory.stockCount,
      createdAt: inventory.createdAt,
      updatedAt: inventory.updatedAt,
    };

    return NextResponse.json(transformedStock, { status: 201 });
  } catch (error: any) {
    console.error("Create stock error:", error);
    return NextResponse.json(
      { error: "Failed to create stock" },
      { status: 500 }
    );
  }
}
