import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createTables() {
  try {
    // 创建期权标的表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS option_target (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        strategy JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建期权指标表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS option_indicator (
        id SERIAL PRIMARY KEY,
        option_id INTEGER NOT NULL REFERENCES option_target(id) ON DELETE CASCADE,
        time TIMESTAMP WITH TIME ZONE NOT NULL,
        current_price DECIMAL(15, 6) NOT NULL,
        iv DECIMAL(10, 4) NOT NULL,
        delta DECIMAL(10, 4) NOT NULL,
        gamma DECIMAL(10, 4) NOT NULL,
        theta DECIMAL(10, 4) NOT NULL,
        vega DECIMAL(10, 4) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 添加 current_price 列（如果不存在）
    try {
      await pool.query(`
        ALTER TABLE option_indicator 
        ADD COLUMN IF NOT EXISTS current_price DECIMAL(15, 6) NOT NULL DEFAULT 0
      `);
    } catch (error) {
      console.log("current_price column might already exist");
    }

    console.log("Tables created successfully");
    await pool.end();
  } catch (error) {
    console.error("Error creating tables:", error);
    process.exit(1);
  }
}

createTables();
