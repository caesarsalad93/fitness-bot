import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import * as schema from './schema.js';
import { config } from 'dotenv';

config({ path: '.env' });
 
export const db = drizzle(sql, { schema });
 
export const getUsers = async () => {
  return db.query.users.findMany();
};