import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface Target {
  id: number;
  name: string;
  total_assets: number;
  profit_loss: number;
  profit_loss_ratio: number;
  total_buy_amount: number;
  total_sell_amount: number;
  average_cost: number;
  created_at: Date;
  updated_at: Date;
}

export interface Transaction {
  id: number;
  target_id: number;
  type: "buy" | "sell";
  quantity: number;
  price: number;
  created_at: Date;
}

export async function dropTables() {
  await pool.query("DROP TABLE IF EXISTS transactions");
  await pool.query("DROP TABLE IF EXISTS targets");
  console.log("Tables dropped successfully");
}

export async function createTargetTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS targets (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      total_assets DECIMAL(15,2) DEFAULT 0,
      total_buy_amount DECIMAL(15,2) DEFAULT 0,
      total_sell_amount DECIMAL(15,2) DEFAULT 0,
      profit_loss DECIMAL(15,2) DEFAULT 0,
      profit_loss_ratio DECIMAL(5,2) DEFAULT 0,
      average_cost DECIMAL(15,2) DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;

  try {
    await pool.query(query);
    console.log("Target table created successfully");
  } catch (error) {
    console.error("Error creating target table:", error);
    throw error;
  }
}

export async function createTransactionTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      target_id INTEGER REFERENCES targets(id) ON DELETE CASCADE,
      type VARCHAR(4) NOT NULL CHECK (type IN ('buy', 'sell')),
      quantity DECIMAL(15,2) NOT NULL,
      price DECIMAL(15,2) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;

  try {
    await pool.query(query);
    console.log("Transaction table created successfully");
  } catch (error) {
    console.error("Error creating transaction table:", error);
    throw error;
  }
}

export async function initDb() {
  try {
    await dropTables();
    await createTargetTable();
    await createTransactionTable();
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

export { pool };
