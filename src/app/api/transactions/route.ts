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
    console.log("Received transaction request:", {
      targetId,
      type,
      quantity,
      price,
    });

    // Input validation
    if (!targetId || !type || !quantity || !price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (quantity <= 0 || price <= 0) {
      return NextResponse.json(
        { error: "Quantity and price must be greater than 0" },
        { status: 400 }
      );
    }

    if (type !== "buy" && type !== "sell") {
      return NextResponse.json(
        { error: "Transaction type must be either 'buy' or 'sell'" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    console.log("Database connection established");

    try {
      await client.query("BEGIN");
      console.log("Transaction started");

      // Get current target state
      const targetResult = await client.query(
        "SELECT * FROM targets WHERE id = $1 FOR UPDATE",
        [targetId]
      );
      console.log("Target query result:", targetResult.rows);

      if (targetResult.rows.length === 0) {
        throw new Error("Target not found");
      }

      const target = targetResult.rows[0];
      console.log("Current target state:", target);

      // Convert string values to numbers to ensure correct calculations
      let newTotalAssets = parseFloat(target.total_assets || "0");
      let newTotalBuyAmount = parseFloat(target.total_buy_amount || "0");
      let newTotalSellAmount = parseFloat(target.total_sell_amount || "0");

      // Make sure quantity and price are numbers
      const numQuantity = parseFloat(quantity);
      const numPrice = parseFloat(price);

      console.log("Starting values after conversion:", {
        newTotalAssets,
        newTotalBuyAmount,
        newTotalSellAmount,
        numQuantity,
        numPrice,
      });

      // Calculate new values based on transaction type
      if (type === "buy") {
        // 买入逻辑
        newTotalAssets = newTotalAssets + numQuantity;
        newTotalBuyAmount = newTotalBuyAmount + numPrice * numQuantity;
      } else {
        // 卖出逻辑
        if (numQuantity > newTotalAssets) {
          // 返回友好的错误提示，使用400状态码表示客户端错误
          return NextResponse.json(
            {
              error: "资产不足",
              details: `当前持有 ${newTotalAssets.toFixed(
                2
              )} 单位资产，不能卖出 ${numQuantity.toFixed(2)} 单位`,
              code: "INSUFFICIENT_ASSETS",
            },
            { status: 400 }
          );
        }
        newTotalAssets = newTotalAssets - numQuantity;
        newTotalSellAmount = newTotalSellAmount + numPrice * numQuantity;
      }

      // 计算盈亏
      const profitLoss = newTotalSellAmount - newTotalBuyAmount;
      const profitLossRatio =
        newTotalBuyAmount > 0
          ? ((profitLoss / newTotalBuyAmount) * 100).toFixed(2)
          : "0.00";

      // 计算平均成本
      const averageCost =
        newTotalAssets > 0
          ? Math.max(
              0,
              (newTotalBuyAmount - newTotalSellAmount) / newTotalAssets
            )
          : 0;

      console.log("Calculated new values:", {
        newTotalAssets,
        newTotalBuyAmount,
        newTotalSellAmount,
        profitLoss,
        profitLossRatio,
        averageCost,
      });

      // Create transaction record
      const transactionResult = await client.query(
        `INSERT INTO transactions (target_id, type, quantity, price)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [targetId, type, numQuantity, numPrice]
      );
      console.log("Transaction record created:", transactionResult.rows[0]);

      // Update target
      const updateResult = await client.query(
        `UPDATE targets 
         SET total_assets = $1,
             total_buy_amount = $2,
             total_sell_amount = $3,
             profit_loss = $4,
             profit_loss_ratio = $5,
             average_cost = $6,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $7
         RETURNING *`,
        [
          newTotalAssets,
          newTotalBuyAmount,
          newTotalSellAmount,
          profitLoss,
          profitLossRatio,
          averageCost,
          targetId,
        ]
      );
      console.log("Target updated:", updateResult.rows[0]);

      await client.query("COMMIT");
      console.log("Transaction committed");

      return NextResponse.json({
        transaction: transactionResult.rows[0],
        target: updateResult.rows[0],
      });
    } catch (error) {
      console.error("Error in transaction:", error);
      await client.query("ROLLBACK");
      console.log("Transaction rolled back");
      throw error;
    } finally {
      client.release();
      console.log("Database connection released");
    }
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      {
        error: "Failed to create transaction",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
