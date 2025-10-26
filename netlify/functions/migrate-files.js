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
    console.log('Starting files table migration...');

    // Create files table
    await sql`
      CREATE TABLE IF NOT EXISTS files (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        size INTEGER NOT NULL,
        url TEXT NOT NULL,
        uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // Add file_id column to messages table if it doesn't exist
    try {
      await sql`ALTER TABLE messages ADD COLUMN file_id INTEGER`;
    } catch (error) {
      console.log('Column file_id might already exist:', error.message);
    }

    // Create indexes for better performance
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON files (uploaded_by)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_files_room_id ON files (room_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_files_created_at ON files (created_at)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_messages_file_id ON messages (file_id)`;
    } catch (error) {
      console.log('Some indexes might already exist:', error.message);
    }

    console.log('Files table migration completed successfully.');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Files table migration completed successfully', 
        timestamp: new Date().toISOString() 
      })
    };
  } catch (error) {
    console.error('Files table migration failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Files table migration failed', 
        details: error.message 
      })
    };
  }
}
