import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL!;

// Only disable SSL if specifically requested or if connecting to a local database.
// Remote databases like Neon require SSL even during local development.
const isLocal = connectionString.includes('sslmode=disable') ||
                connectionString.includes('localhost') ||
                connectionString.includes('127.0.0.1');

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 30000,
  max: 10,
  ssl: isLocal ? false : {
    rejectUnauthorized: false,
  },
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('[DATABASE] Unexpected pool error:', err.message);
});

const adapter = new PrismaPg(pool as any);

export const prisma = new PrismaClient({ adapter });
