import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.NETLIFY_DATABASE_URL);

export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    console.log('Checking all tables in database...');

    // Get all table names
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;

    console.log('Found tables:', tables);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Database tables checked successfully',
        tables: tables.map(t => t.table_name),
        count: tables.length,
        timestamp: new Date().toISOString() 
      })
    };
  } catch (error) {
    console.error('Check tables failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Check tables failed', 
        details: error.message 
      })
    };
  }
}
