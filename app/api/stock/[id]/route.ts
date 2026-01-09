import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/connect";
import Inventory from "@/models/Inventory";
import { authenticateRequest } from "@/lib/middleware/auth";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid stock ID" }, { status: 400 });
    }

    const stock = await Inventory.findOne({ _id: id, archived: false }).lean();

    if (!stock) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 });
    }

    const transformedStock = {
      id: stock._id.toString(),
      itemId: stock.itemId,
      itemName: stock.itemName,
      stockCount: stock.stockCount,
      createdAt: stock.createdAt,
      updatedAt: stock.updatedAt,
    };

    return NextResponse.json(transformedStock);
  } catch (error: any) {
    console.error("Get stock error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid stock ID" }, { status: 400 });
    }

    const body = await request.json();
    const { itemId, itemName, stockCount } = body;

    const stock = await Inventory.findOne({ _id: id, archived: false });
    if (!stock) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 });
    }

    // Update fields
    if (itemId) stock.itemId = itemId;
    if (itemName) stock.itemName = itemName;
    if (stockCount !== undefined) stock.stockCount = parseInt(stockCount) || 0;

    await stock.save();

    const transformedStock = {
      id: stock._id.toString(),
      itemId: stock.itemId,
      itemName: stock.itemName,
      stockCount: stock.stockCount,
      createdAt: stock.createdAt,
      updatedAt: stock.updatedAt,
    };

    return NextResponse.json(transformedStock);
  } catch (error: any) {
    console.error("Update stock error:", error);
    return NextResponse.json(
      { error: "Failed to update stock" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid stock ID" }, { status: 400 });
    }

    const stock = await Inventory.findByIdAndDelete(id);
    if (!stock) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Stock deleted successfully" });
  } catch (error: any) {
    console.error("Delete stock error:", error);
    return NextResponse.json(
      { error: "Failed to delete stock" },
      { status: 500 }
    );
  }
}
