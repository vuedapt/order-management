import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/middleware/auth";
import { generateOrderTemplate } from "@/lib/exports/orderTemplate";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const buffer = generateOrderTemplate();

    return new NextResponse(buffer as any, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=order-template.xlsx",
      },
    });
  } catch (error: any) {
    console.error("Error generating order template:", error);
    return NextResponse.json(
      { error: "Failed to generate order template" },
      { status: 500 }
    );
  }
}

