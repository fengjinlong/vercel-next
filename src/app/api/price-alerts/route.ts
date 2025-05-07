import { NextResponse } from "next/server";
import {
  getAllPriceAlerts,
  createPriceAlert,
  updatePriceAlert,
  deletePriceAlert,
} from "../../../lib/db";

export async function GET() {
  try {
    // console.log("Attempting to fetch price alerts...");
    const alerts = await getAllPriceAlerts();
    // console.log("Successfully fetched alerts:", alerts);
    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    // 打印更详细的错误信息
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    }
    return NextResponse.json(
      {
        error: "Failed to fetch alerts",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const alert = await createPriceAlert({
      coin: data.coin,
      direction: data.direction,
      target_price: data.targetPrice,
      email: data.email,
      interval: data.interval,
    });
    return NextResponse.json(alert);
  } catch (error) {
    console.error("Error creating alert:", error);
    return NextResponse.json(
      { error: "Failed to create alert" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;

    // Convert field names to match database schema
    const dbData = {
      paused: updateData.paused,
      last_triggered: updateData.lastTriggered,
      last_checked: updateData.lastChecked,
    };

    const alert = await updatePriceAlert(id, dbData);
    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }
    return NextResponse.json(alert);
  } catch (error) {
    console.error("Error updating alert:", error);
    return NextResponse.json(
      { error: "Failed to update alert" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    const success = await deletePriceAlert(id);
    if (!success) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting alert:", error);
    return NextResponse.json(
      { error: "Failed to delete alert" },
      { status: 500 }
    );
  }
}
