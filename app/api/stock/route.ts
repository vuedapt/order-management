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

// GET - Fetch all stock items with pagination
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
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

    const total = await Stock.countDocuments(filter);
    const skip = (page - 1) * pageSize;

    const stocks = await Stock.find(filter)
      .sort({ itemName: 1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    return NextResponse.json({
      stocks: stocks.map((stock: any) => ({
        id: stock._id.toString(),
        itemId: stock.itemId,
        itemName: stock.itemName,
        stockCount: stock.stockCount,
        createdAt: stock.createdAt,
        updatedAt: stock.updatedAt,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error: any) {
    console.error("Error fetching stock:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new stock item
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { itemId, itemName, stockCount } = body;

    if (!itemId || !itemName || stockCount === undefined) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const stock = new Stock({
      itemId,
      itemName,
      stockCount: parseInt(stockCount),
    });

    await stock.save();

    return NextResponse.json({
      id: stock._id.toString(),
      itemId: stock.itemId,
      itemName: stock.itemName,
      stockCount: stock.stockCount,
      createdAt: stock.createdAt,
      updatedAt: stock.updatedAt,
    });
  } catch (error: any) {
    console.error("Error creating stock:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Item ID already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

