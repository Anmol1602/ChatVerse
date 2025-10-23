import { neon } from '@neondatabase/serverless';

export async function handler(event, context) {
  try {
    console.log('Starting database migration...');
    console.log('Database URL available:', !!process.env.NETLIFY_DATABASE_URL);

    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    // Add last_read_at column to room_members table if it doesn't exist
    console.log('Adding last_read_at column to room_members...');
    try {
      await sql`
        ALTER TABLE room_members 
        ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMP DEFAULT NOW()
      `;
      console.log('Successfully added last_read_at column');
    } catch (error) {
      console.log('Column might already exist or error occurred:', error.message);
    }

    // Update existing records to set last_read_at to joined_at
    console.log('Updating existing records...');
    await sql`
      UPDATE room_members 
      SET last_read_at = joined_at 
      WHERE last_read_at IS NULL
    `;

    console.log('Database migration completed successfully');

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Database migration completed successfully',
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Database migration error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Failed to migrate database',
        details: error.message
      })
    };
  }
}
