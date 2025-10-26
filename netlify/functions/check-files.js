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
    console.log('Checking files table...');

    // Get all files
    const files = await sql`
      SELECT 
        f.id,
        f.name,
        f.type,
        f.size,
        f.uploaded_by,
        f.room_id,
        f.created_at,
        u.name as uploaded_by_name
      FROM files f
      LEFT JOIN users u ON f.uploaded_by = u.id
      ORDER BY f.created_at DESC
    `;

    console.log('Found files:', files);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Files table checked successfully',
        files: files,
        count: files.length,
        timestamp: new Date().toISOString() 
      })
    };
  } catch (error) {
    console.error('Check files failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Check files failed', 
        details: error.message 
      })
    };
  }
}
