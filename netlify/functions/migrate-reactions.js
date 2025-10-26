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
    console.log('Starting reactions table migration...');

    // Create message_reactions table
    await sql`
      CREATE TABLE IF NOT EXISTS message_reactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        emoji VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(message_id, user_id, emoji)
      );
    `;

    // Create indexes for better performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions (message_id);
      CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions (user_id);
      CREATE INDEX IF NOT EXISTS idx_message_reactions_emoji ON message_reactions (emoji);
      CREATE INDEX IF NOT EXISTS idx_message_reactions_created_at ON message_reactions (created_at);
    `;

    console.log('Reactions table migration completed successfully.');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Reactions table migration completed successfully', 
        timestamp: new Date().toISOString() 
      })
    };
  } catch (error) {
    console.error('Reactions table migration failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Reactions table migration failed', 
        details: error.message 
      })
    };
  }
}
