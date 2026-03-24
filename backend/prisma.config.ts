import { defineConfig } from '@prisma/config';
import dotenv from 'dotenv';

// Load environment variables for Prisma Migrate CLI
dotenv.config();

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
