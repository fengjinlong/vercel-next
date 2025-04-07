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

export async function createTargetTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS targets (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      total_assets DECIMAL(15,2) DEFAULT 0,
      profit_loss DECIMAL(15,2) DEFAULT 0,
      profit_loss_ratio DECIMAL(5,2) DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export async function createTransactionTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      target_id INTEGER REFERENCES targets(id) ON DELETE CASCADE,
      type VARCHAR(4) NOT NULL CHECK (type IN ('buy', 'sell')),
      quantity DECIMAL(15,2) NOT NULL,
      price DECIMAL(15,2) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export async function initDb() {
  await createTargetTable();
  await createTransactionTable();
}

export { pool };
