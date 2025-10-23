import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

export async function handler(event, context) {
  const sql = neon(process.env.NETLIFY_DATABASE_URL);

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Credentials': 'true'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
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
    // Verify JWT token
    const token = event.headers.authorization?.replace('Bearer ', '') || 
                  event.headers.cookie?.split('token=')[1]?.split(';')[0];
    
    if (!token) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'No token provided' })
      };
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    const { targetUserId } = JSON.parse(event.body);
    const currentUserId = decoded.id;

    if (!targetUserId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Target user ID is required' })
      };
    }

    if (currentUserId === targetUserId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Cannot create DM with yourself' })
      };
    }

    // Check if DM room already exists between these two users
    const existingRoom = await sql`
      SELECT r.id, r.name, r.type, r.created_at, r.updated_at
      FROM rooms r
      WHERE r.type = 'dm' 
      AND r.id IN (
        SELECT rm1.room_id 
        FROM room_members rm1 
        JOIN room_members rm2 ON rm1.room_id = rm2.room_id
        WHERE rm1.user_id = ${currentUserId} 
        AND rm2.user_id = ${targetUserId}
      )
      AND (
        SELECT COUNT(*) FROM room_members rm 
        WHERE rm.room_id = r.id
      ) = 2
    `;

    if (existingRoom.length > 0) {
      // DM room already exists, return it
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'DM room already exists',
          room: existingRoom[0],
          isNew: false
        })
      };
    }

    // Get target user info for room name
    const targetUser = await sql`
      SELECT id, name, email FROM users WHERE id = ${targetUserId}
    `;

    if (targetUser.length === 0) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Target user not found' })
      };
    }

    // Create new DM room
    const newRoom = await sql`
      INSERT INTO rooms (name, description, type, created_by, created_at, updated_at)
      VALUES (
        ${`DM: ${targetUser[0].name}`}, 
        ${`Direct message with ${targetUser[0].name}`}, 
        'dm', 
        ${currentUserId}, 
        NOW(), 
        NOW()
      )
      RETURNING id, name, description, type, created_by, created_at, updated_at
    `;

    const roomId = newRoom[0].id;

    // Add both users to the room
    await sql`
      INSERT INTO room_members (room_id, user_id, joined_at)
      VALUES 
        (${roomId}, ${currentUserId}, NOW()),
        (${roomId}, ${targetUserId}, NOW())
    `;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'DM room created successfully',
        room: newRoom[0],
        isNew: true
      })
    };

  } catch (error) {
    console.error('Create DM error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Failed to create DM room',
        details: error.message
      })
    };
  }
}
