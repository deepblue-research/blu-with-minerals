import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL!;
const isLocal = process.env.NODE_ENV !== 'production' || connectionString.includes('sslmode=disable');

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
