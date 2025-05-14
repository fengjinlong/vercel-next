import { NextResponse } from "next/server";
import { deleteOptionEstimate } from "@/lib/db";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    const success = await deleteOptionEstimate(id);

    if (!success) {
      return NextResponse.json(
        { error: "Option estimate not found" },
        { status: 404 }
      );
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
