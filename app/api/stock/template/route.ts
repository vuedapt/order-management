import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/middleware/auth";
import { generateStockTemplate } from "@/lib/exports/stockTemplate";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const buffer = generateStockTemplate();
    
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=stock-template.xlsx",
      },
    });
  } catch (error: any) {
    console.error("Error generating stock template:", error);
    return NextResponse.json(
      { error: "Failed to generate stock template" },
      { status: 500 }
    );
  }
}

