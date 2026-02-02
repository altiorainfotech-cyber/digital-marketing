require('dotenv').config();
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');

neonConfig.webSocketConstructor = ws;

async function test() {
  const connectionString = process.env.DATABASE_URL;
  console.log('Connection string:', connectionString?.substring(0, 50));
  
  const pool = new Pool({ connectionString });
  
  try {
    const result = await pool.query('SELECT id, email FROM "User" LIMIT 1');
    console.log('✅ Direct pool query works!');
    console.log('User:', result.rows[0]);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

test();
