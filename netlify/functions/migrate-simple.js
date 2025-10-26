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
    console.log('Starting simple migration...');

    // Create files table
    await sql`
      CREATE TABLE IF NOT EXISTS files (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        size INTEGER NOT NULL,
        url TEXT NOT NULL,
        uploaded_by INTEGER NOT NULL,
        room_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    console.log('Files table created successfully.');

    // Create message_reactions table
    await sql`
      CREATE TABLE IF NOT EXISTS message_reactions (
        id SERIAL PRIMARY KEY,
        message_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        emoji VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(message_id, user_id, emoji)
      )
    `;

    console.log('Message reactions table created successfully.');

    // Add file_id column to messages table
    try {
      await sql`ALTER TABLE messages ADD COLUMN file_id INTEGER`;
      console.log('file_id column added to messages table.');
    } catch (error) {
      console.log('file_id column might already exist:', error.message);
    }

    // Add last_read_at column to room_members table
    try {
      await sql`ALTER TABLE room_members ADD COLUMN last_read_at TIMESTAMP DEFAULT NOW()`;
      console.log('last_read_at column added to room_members table.');
    } catch (error) {
      console.log('last_read_at column might already exist:', error.message);
    }

    console.log('Simple migration completed successfully.');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Simple migration completed successfully', 
        timestamp: new Date().toISOString() 
      })
    };
  } catch (error) {
    console.error('Simple migration failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Simple migration failed', 
        details: error.message 
      })
    };
  }
}
