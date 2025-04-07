import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

// GET /api/transactions
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetId = searchParams.get("targetId");

  if (!targetId) {
    return NextResponse.json(
      { error: "Target ID is required" },
      { status: 400 }
    );
  }

  try {
    const result = await pool.query(
      "SELECT * FROM transactions WHERE target_id = $1 ORDER BY created_at DESC",
      [targetId]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

// POST /api/transactions
export async function POST(request: Request) {
  try {
    const { targetId, type, quantity, price } = await request.json();

    if (!targetId || !type || !quantity || !price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Insert transaction
      const transactionResult = await client.query(
        "INSERT INTO transactions (target_id, type, quantity, price) VALUES ($1, $2, $3, $4) RETURNING *",
        [targetId, type, quantity, price]
      );

      // Update target's total assets and profit/loss
      const targetResult = await client.query(
        "SELECT * FROM targets WHERE id = $1",
        [targetId]
      );

      const target = targetResult.rows[0];
      const transactionAmount = quantity * price;
      let newTotalAssets = target.total_assets;

      if (type === "buy") {
        newTotalAssets += transactionAmount;
      } else {
        newTotalAssets -= transactionAmount;
      }

      // Calculate profit/loss
      const profitLoss = newTotalAssets - target.total_assets;
      const profitLossRatio = (profitLoss / target.total_assets) * 100;

      await client.query(
        `UPDATE targets 
         SET total_assets = $1,
             profit_loss = $2,
             profit_loss_ratio = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [newTotalAssets, profitLoss, profitLossRatio, targetId]
      );

      await client.query("COMMIT");

      return NextResponse.json(transactionResult.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
