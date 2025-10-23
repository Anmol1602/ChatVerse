import { neon } from '@neondatabase/serverless';

export async function handler(event, context) {
  try {
    console.log('Starting database initialization...');
    console.log('Database URL available:', !!process.env.NETLIFY_DATABASE_URL);
    
    // Configure neon with the database URL
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    
    // Create users table
    console.log('Creating users table...');
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        avatar TEXT,
        online BOOLEAN DEFAULT false,
        last_seen TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create rooms table
    console.log('Creating rooms table...');
    await sql`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) DEFAULT 'group',
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create room_members table
    console.log('Creating room_members table...');
    await sql`
      CREATE TABLE IF NOT EXISTS room_members (
        id SERIAL PRIMARY KEY,
        room_id INTEGER,
        user_id INTEGER,
        joined_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(room_id, user_id)
      )
    `;

    // Create messages table
    console.log('Creating messages table...');
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        room_id INTEGER,
        user_id INTEGER,
        content TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'text',
        read_by INTEGER[] DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Add foreign key constraints after tables are created
    console.log('Adding foreign key constraints...');
    try {
      await sql`ALTER TABLE rooms ADD CONSTRAINT fk_rooms_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE`;
    } catch (e) {
      console.log('Foreign key constraint for rooms.created_by may already exist');
    }

    try {
      await sql`ALTER TABLE room_members ADD CONSTRAINT fk_room_members_room_id FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE`;
    } catch (e) {
      console.log('Foreign key constraint for room_members.room_id may already exist');
    }

    try {
      await sql`ALTER TABLE room_members ADD CONSTRAINT fk_room_members_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`;
    } catch (e) {
      console.log('Foreign key constraint for room_members.user_id may already exist');
    }

    try {
      await sql`ALTER TABLE messages ADD CONSTRAINT fk_messages_room_id FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE`;
    } catch (e) {
      console.log('Foreign key constraint for messages.room_id may already exist');
    }

    try {
      await sql`ALTER TABLE messages ADD CONSTRAINT fk_messages_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`;
    } catch (e) {
      console.log('Foreign key constraint for messages.user_id may already exist');
    }

    // Create indexes for better performance
    console.log('Creating indexes...');
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON room_members(room_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON room_members(user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_users_online ON users(online)`;
    } catch (e) {
      console.log('Some indexes may already exist:', e.message);
    }

    console.log('Database initialization completed successfully');

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        message: 'Database initialized successfully',
        tables: ['users', 'rooms', 'room_members', 'messages'],
        status: 'success'
      })
    };

  } catch (error) {
    console.error('Database initialization error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Failed to initialize database',
        details: error.message,
        stack: error.stack
      })
    };
  }
}