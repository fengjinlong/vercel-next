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

      // Create transaction
      const transactionResult = await client.query(
        `INSERT INTO transactions (target_id, type, quantity, price)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [targetId, type, quantity, price]
      );

      // Get current target state
      const targetResult = await client.query(
        "SELECT * FROM targets WHERE id = $1",
        [targetId]
      );

      if (targetResult.rows.length === 0) {
        throw new Error("Target not found");
      }

      const target = targetResult.rows[0];
      let newTotalAssets = target.total_assets;
      let newTotalBuyAmount = target.total_buy_amount;
      let newTotalSellAmount = target.total_sell_amount;
      let newAverageCost = target.average_cost;

      if (type === "buy") {
        newTotalAssets += quantity;
        newTotalBuyAmount += quantity * price;
        // 计算新的平均成本
        newAverageCost = newTotalBuyAmount / newTotalAssets;
      } else {
        newTotalAssets -= quantity;
        newTotalSellAmount += quantity * price;
      }

      const profitLoss =
        newTotalSellAmount -
        newTotalBuyAmount * (newTotalSellAmount / (newTotalBuyAmount + 0.0001));
      const profitLossRatio = (
        (profitLoss / (newTotalBuyAmount + 0.0001)) *
        100
      ).toFixed(2);

      await client.query(
        `UPDATE targets 
         SET total_assets = $1,
             profit_loss = $2,
             profit_loss_ratio = $3,
             total_buy_amount = $4,
             total_sell_amount = $5,
             average_cost = $6,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $7`,
        [
          newTotalAssets,
          profitLoss,
          profitLossRatio,
          newTotalBuyAmount,
          newTotalSellAmount,
          newAverageCost,
          targetId,
        ]
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
