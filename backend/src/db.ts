import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import dns from "dns";
import { promisify } from "util";

const resolveDns = promisify(dns.lookup);

// Ensure environment variables are loaded
dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;

/**
 * Configure the PG Pool for Neon Pooler compatibility.
 * We use ssl: { rejectUnauthorized: false } to bypass CA certificate verification
 * issues common in local container environments.
 */
const sslConfig = {
  rejectUnauthorized: false
};

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 15000,
  max: 10,
  ssl: sslConfig,
  idleTimeoutMillis: 30000,
});

/**
 * Startup Connection Test with IP Resolution and SSL Debugging
 */
(async () => {
  console.log('--- Database Connection Debugging ---');

  try {
    const url = new URL(connectionString);
    const host = url.hostname;
    console.log(`Target Host: ${host}`);
    console.log(`SSL Config: ${JSON.stringify(sslConfig)}`);
    console.log(`PgBouncer Mode: ${connectionString.includes('pgbouncer=true')}`);

    const lookup = await resolveDns(host);
    console.log(`Resolved IP: ${lookup.address} (Family: IPv${lookup.family})`);

    console.log('Attempting pool connection (Handshake)...');
    const client = await pool.connect();
    console.log('✅ Successfully connected to the database pool.');

    const res = await client.query('SELECT NOW()');
    console.log('✅ Database query successful. Server time:', res.rows[0].now);

    client.release();
  } catch (err: any) {
    console.error('❌ Database connection test failed!');
    console.error('Error Code:', err.code || 'N/A');
    console.error('Error Message:', err.message);

    if (err.stack) {
      console.error('Stack Trace:', err.stack);
    }

    if (err.message.includes('ETIMEDOUT')) {
      console.error('HINT: Connection timed out. Since DNS resolved to the correct public IP, this usually means:');
      console.error('1. The MTU is too high (SSL packet fragmentation).');
      console.error('2. A local firewall is blocking the outbound handshake.');
      console.error('3. The database server is dropping packets from your specific network.');
    }
  }
  console.log('-------------------------------------');
})();

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message);
});

const adapter = new PrismaPg(pool as any);

/**
 * Singleton instance of PrismaClient using the PG adapter.
 */
export const prisma = new PrismaClient({ adapter });
