import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 添加数据库连接测试
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

// 测试数据库连接
export async function testConnection() {
  try {
    const client = await pool.connect();
    console.log("Database connection successful");
    client.release();
    return true;
  } catch (error) {
    console.error("Error connecting to the database:", error);
    return false;
  }
}

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

export interface PriceAlert {
  id: number;
  coin: string;
  direction: string;
  target_price: number;
  email: string;
  interval: number;
  paused: boolean;
  last_checked: Date | null;
  last_triggered: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface OptionEstimate {
  id: number;
  name: string;
  current_price: number;
  estimate_date: string;
  expiry_date: string;
  lower_bound: number;
  upper_bound: number;
  lower_bound_95: number;
  upper_bound_95: number;
  iv: number;
  created_at: string;
}

export interface CreateOptionEstimateData {
  name: string;
  current_price: number;
  estimate_date: string;
  expiry_date: string;
  lower_bound: number;
  upper_bound: number;
  lower_bound_95: number;
  upper_bound_95: number;
  iv?: number;
}

export async function resetDatabase() {
  console.warn("WARNING: This will delete all data from the database!");
  await pool.query("DROP TABLE IF EXISTS transactions");
  await pool.query("DROP TABLE IF EXISTS targets");
  await pool.query("DROP TABLE IF EXISTS price_alerts");
  await pool.query("DROP TABLE IF EXISTS option_estimates");
  console.log("Tables dropped successfully");
}

export async function createTargetTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS targets (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      total_assets DECIMAL(15,6) DEFAULT 0,
      total_buy_amount DECIMAL(15,6) DEFAULT 0,
      total_sell_amount DECIMAL(15,6) DEFAULT 0,
      profit_loss DECIMAL(15,6) DEFAULT 0,
      profit_loss_ratio DECIMAL(5,2) DEFAULT 0,
      average_cost DECIMAL(15,6) DEFAULT 0,
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
      quantity DECIMAL(15,6) NOT NULL,
      price DECIMAL(15,6) NOT NULL,
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

export async function createPriceAlertTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS price_alerts (
      id SERIAL PRIMARY KEY,
      coin VARCHAR(10) NOT NULL,
      direction VARCHAR(5) NOT NULL CHECK (direction IN ('above', 'below')),
      target_price DECIMAL(15,6) NOT NULL,
      email VARCHAR(100) NOT NULL,
      interval INTEGER NOT NULL,
      paused BOOLEAN DEFAULT false,
      last_checked TIMESTAMP WITH TIME ZONE,
      last_triggered TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;

  try {
    await pool.query(query);
    console.log("Price alert table created successfully");
  } catch (error) {
    console.error("Error creating price alert table:", error);
    throw error;
  }
}

export async function createOptionEstimateTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS option_estimates (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      current_price DECIMAL(15,6) NOT NULL,
      estimate_date DATE NOT NULL,
      expiry_date DATE NOT NULL,
      lower_bound DECIMAL(15,6) NOT NULL,
      upper_bound DECIMAL(15,6) NOT NULL,
      lower_bound_95 DECIMAL(15,6) NOT NULL,
      upper_bound_95 DECIMAL(15,6) NOT NULL,
      iv DECIMAL(15,6) NOT NULL,
      created_at DATE DEFAULT CURRENT_DATE
    )
  `;

  try {
    await pool.query(query);
    console.log("Option estimate table created successfully");
  } catch (error) {
    console.error("Error creating option estimate table:", error);
    throw error;
  }
}

export async function addIvColumn() {
  const query = `
    ALTER TABLE option_estimates 
    ADD COLUMN IF NOT EXISTS iv DECIMAL(15,6);
  `;

  try {
    await pool.query(query);
    console.log("Added iv column successfully");
  } catch (error) {
    console.error("Error adding iv column:", error);
    throw error;
  }
}

export async function initDb() {
  try {
    await createTargetTable();
    await createTransactionTable();
    await createPriceAlertTable();
    await createOptionEstimateTable();
    await addIvColumn();
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

export async function updateDecimalPrecision() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Update targets table
    await client.query(`
      ALTER TABLE targets
      ALTER COLUMN total_assets TYPE DECIMAL(15,6),
      ALTER COLUMN total_buy_amount TYPE DECIMAL(15,6),
      ALTER COLUMN total_sell_amount TYPE DECIMAL(15,6),
      ALTER COLUMN profit_loss TYPE DECIMAL(15,6),
      ALTER COLUMN average_cost TYPE DECIMAL(15,6);
    `);

    // Update transactions table
    await client.query(`
      ALTER TABLE transactions
      ALTER COLUMN quantity TYPE DECIMAL(15,6),
      ALTER COLUMN price TYPE DECIMAL(15,6);
    `);

    await client.query("COMMIT");
    console.log(
      "Successfully updated decimal precision for all relevant columns"
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating decimal precision:", error);
    throw error;
  } finally {
    client.release();
  }
}

export async function getAllPriceAlerts(): Promise<PriceAlert[]> {
  const query = "SELECT * FROM price_alerts ORDER BY created_at DESC";
  const { rows } = await pool.query(query);
  return rows;
}

export async function createPriceAlert(data: {
  coin: string;
  direction: "above" | "below";
  target_price: number;
  email: string;
  interval: number;
}): Promise<PriceAlert> {
  const query = `
    INSERT INTO price_alerts (coin, direction, target_price, email, interval)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const values = [
    data.coin,
    data.direction,
    data.target_price,
    data.email,
    data.interval,
  ];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

export async function updatePriceAlert(
  id: number,
  data: Partial<PriceAlert>
): Promise<PriceAlert | null> {
  const setClause = Object.entries(data)
    .map(([key, _], index) => `${key} = $${index + 2}`)
    .join(", ");

  const query = `
    UPDATE price_alerts
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
  `;

  const values = [id, ...Object.values(data)];
  const { rows } = await pool.query(query, values);
  return rows[0] || null;
}

export async function deletePriceAlert(id: number): Promise<boolean> {
  const query = "DELETE FROM price_alerts WHERE id = $1";
  const result = await pool.query(query, [id]);
  return result.rowCount ? result.rowCount > 0 : false;
}

export async function getAllOptionEstimates(): Promise<OptionEstimate[]> {
  const query = `
    SELECT 
      id,
      name,
      current_price,
      TO_CHAR(estimate_date, 'YYYY-MM-DD') as estimate_date,
      TO_CHAR(expiry_date, 'YYYY-MM-DD') as expiry_date,
      lower_bound,
      upper_bound,
      lower_bound_95,
      upper_bound_95,
      iv,
      TO_CHAR(created_at, 'YYYY-MM-DD') as created_at
    FROM option_estimates 
    ORDER BY created_at DESC
  `;
  const result = await pool.query(query);
  return result.rows;
}

export async function createOptionEstimate(
  data: CreateOptionEstimateData
): Promise<OptionEstimate> {
  console.log("DB createOptionEstimate received data:", data); // 添加日志

  const query = `
    INSERT INTO option_estimates (
      name,
      current_price,
      estimate_date,
      expiry_date,
      lower_bound,
      upper_bound,
      lower_bound_95,
      upper_bound_95,
      iv
    ) VALUES ($1, $2, $3::date, $4::date, $5, $6, $7, $8, $9)
    RETURNING 
      id,
      name,
      current_price,
      TO_CHAR(estimate_date, 'YYYY-MM-DD') as estimate_date,
      TO_CHAR(expiry_date, 'YYYY-MM-DD') as expiry_date,
      lower_bound,
      upper_bound,
      lower_bound_95,
      upper_bound_95,
      iv,
      TO_CHAR(created_at, 'YYYY-MM-DD') as created_at
  `;

  const values = [
    data.name,
    data.current_price,
    data.estimate_date,
    data.expiry_date,
    data.lower_bound,
    data.upper_bound,
    data.lower_bound_95,
    data.upper_bound_95,
    data.iv,
  ];

  console.log("DB query values:", values); // 添加日志

  const result = await pool.query(query, values);
  console.log("DB query result:", result.rows[0]); // 添加日志
  return result.rows[0];
}

export async function deleteOptionEstimate(id: number): Promise<boolean> {
  const query = "DELETE FROM option_estimates WHERE id = $1";
  const result = await pool.query(query, [id]);
  return result.rowCount ? result.rowCount > 0 : false;
}

export { pool };
