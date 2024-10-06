import { defineConfig } from 'drizzle-kit';
 
export default defineConfig({
  dialect: "postgresql",
  schema: './drizzle/schema.ts',
  out: './migrations',
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
});
