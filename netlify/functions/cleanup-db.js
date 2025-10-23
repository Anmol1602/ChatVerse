import { neon } from '@neondatabase/serverless';

export async function handler(event, context) {
  // Configure neon with the database URL
  const sql = neon(process.env.NETLIFY_DATABASE_URL);

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Credentials': 'true'
      },
      body: ''
    };
  }

  // Accept both GET and POST for easier testing
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('Starting database cleanup...');

    // Delete in order to respect foreign key constraints
    // 1. Delete messages first (references rooms)
    console.log('Deleting messages...');
    await sql`DELETE FROM messages`;
    
    // 2. Delete room_members (references rooms and users)
    console.log('Deleting room members...');
    await sql`DELETE FROM room_members`;
    
    // 3. Delete rooms (references users)
    console.log('Deleting rooms...');
    await sql`DELETE FROM rooms`;
    
    // 4. Delete users last
    console.log('Deleting users...');
    await sql`DELETE FROM users`;

    // Get counts to verify cleanup
    const userCount = await sql`SELECT COUNT(*) FROM users`;
    const roomCount = await sql`SELECT COUNT(*) FROM rooms`;
    const messageCount = await sql`SELECT COUNT(*) FROM messages`;

    console.log('Database cleanup completed successfully');

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Database cleanup completed successfully',
        remaining: {
          users: userCount[0].count,
          rooms: roomCount[0].count,
          messages: messageCount[0].count
        },
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Database cleanup error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Database cleanup failed',
        details: error.message,
        stack: error.stack
      })
    };
  }
}
