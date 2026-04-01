import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config({ debug: true });

const connectionString = process.env.DATABASE_URL!;

export const pool = new Pool({
  connectionString,
  max: 20, // max number of connection can be open to database
  idleTimeoutMillis: 30000, // close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // return an error after 2 seconds if connection could not be established
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export const testConnection = async () => {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("✅ Database connection successful:", res.rows[0].now);
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    process.exit(-1);
  }
};
