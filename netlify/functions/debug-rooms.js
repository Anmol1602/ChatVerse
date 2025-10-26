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
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Credentials': 'true'
      },
      body: ''
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

    const userId = decoded.id;

    // Get all rooms
    const allRooms = await sql`
      SELECT 
        r.id,
        r.name,
        r.description,
        r.type,
        r.created_by,
        r.created_at,
        r.updated_at
      FROM rooms r
      ORDER BY r.created_at DESC
    `;

    // Get all room members
    const allRoomMembers = await sql`
      SELECT 
        rm.room_id,
        rm.user_id,
        rm.joined_at,
        u.name as user_name,
        u.email as user_email
      FROM room_members rm
      JOIN users u ON rm.user_id = u.id
      ORDER BY rm.room_id, rm.joined_at
    `;

    // Get user's specific rooms
    const userRooms = await sql`
      SELECT 
        r.id,
        r.name,
        r.description,
        r.type,
        r.created_by,
        r.created_at,
        r.updated_at
      FROM rooms r
      WHERE r.id IN (
        SELECT room_id FROM room_members WHERE user_id = ${userId}
      )
      ORDER BY r.created_at DESC
    `;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        allRooms,
        allRoomMembers,
        userRooms,
        totalRooms: allRooms.length,
        totalMembers: allRoomMembers.length,
        userRoomCount: userRooms.length
      })
    };

  } catch (error) {
    console.error('Debug rooms error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Debug failed', 
        details: error.message,
        stack: error.stack 
      })
    };
  }
}
