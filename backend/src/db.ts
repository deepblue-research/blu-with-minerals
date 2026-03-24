import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

// Ensure environment variables are loaded
dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;

/**
 * Configure the PG Pool.
 * Increased timeout is kept to handle potential Neon cold starts in production.
 */
const sslConfig = {
  rejectUnauthorized: false // Required for compatibility with Neon and Cloud Run's network layer
};

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 30000, // 30 seconds for robust connections
  max: 10,
  ssl: sslConfig,
  idleTimeoutMillis: 30000,
});

/**
 * Global pool error listener to monitor for connection drops in production.
 */
pool.on('error', (err) => {
  console.error('[DATABASE] Unexpected pool error:', err.message);
});

const adapter = new PrismaPg(pool as any);

/**
 * Singleton instance of PrismaClient using the PG adapter.
 * This instance is shared throughout the application to manage connections efficiently.
 */
export const prisma = new PrismaClient({ adapter });
