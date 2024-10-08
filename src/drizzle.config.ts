import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
 
export default defineConfig({
  dialect: "postgresql",
  schema: './drizzle/schema.ts',
  out: './migrations',
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
});
