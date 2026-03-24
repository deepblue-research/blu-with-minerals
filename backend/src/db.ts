import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

// Ensure environment variables are loaded
dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);

/**
 * Singleton instance of PrismaClient.
 * Moving this to a dedicated file prevents circular dependency issues
 * where routes or services might import an uninitialized prisma object from index.ts.
 */
export const prisma = new PrismaClient({ adapter });
