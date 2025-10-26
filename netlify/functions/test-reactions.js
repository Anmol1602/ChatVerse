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
    console.log('Testing reactions table...');

    // Check if message_reactions table exists and has data
    const reactions = await sql`
      SELECT 
        r.id,
        r.message_id,
        r.user_id,
        r.emoji,
        r.created_at,
        u.name as user_name
      FROM message_reactions r
      LEFT JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
      LIMIT 10
    `;

    // Get table structure
    const tableInfo = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'message_reactions'
      ORDER BY ordinal_position
    `;

    console.log('Found reactions:', reactions);
    console.log('Table structure:', tableInfo);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Reactions table test completed',
        reactions: reactions,
        tableStructure: tableInfo,
        count: reactions.length,
        timestamp: new Date().toISOString() 
      })
    };
  } catch (error) {
    console.error('Test reactions failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Test reactions failed', 
        details: error.message 
      })
    };
  }
}
