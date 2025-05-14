import { NextResponse } from "next/server";
import {
  getAllOptionEstimates,
  createOptionEstimate,
  deleteOptionEstimate,
  type CreateOptionEstimateData,
} from "@/lib/db";

// GET /api/option-estimates
export async function GET() {
  try {
    const estimates = await getAllOptionEstimates();
    return NextResponse.json(estimates);
  } catch (error) {
    console.error("Failed to fetch option estimates:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch option estimates",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// POST /api/option-estimates
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Received request body:", body);

    const data: CreateOptionEstimateData = {
      name: body.name,
      current_price: body.currentPrice,
      estimate_date: body.currentDate,
      expiry_date: body.expiryDate,
      lower_bound: body.lowerBound,
      upper_bound: body.upperBound,
      lower_bound_95: body.lowerBound95,
      upper_bound_95: body.upperBound95,
    };

    console.log("Processed data:", data);

    const result = await createOptionEstimate(data);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to create option estimate:", error);
    return NextResponse.json(
      {
        error: "Failed to create option estimate",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// DELETE /api/option-estimates/:id
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const success = await deleteOptionEstimate(id);
    if (!success) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete option estimate:", error);
    return NextResponse.json(
      {
        error: "Failed to delete option estimate",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
