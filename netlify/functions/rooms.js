import { client } from '@netlify/database';
import jwt from 'jsonwebtoken';

export async function handler(event, context) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

    if (event.httpMethod === 'GET') {
      // Get user's rooms
      const { data: rooms } = await client.query(`
        SELECT 
          r.id,
          r.name,
          r.description,
          r.type,
          r.created_at,
          r.updated_at,
          COUNT(rm.user_id) as member_count,
          MAX(m.created_at) as last_message_at
        FROM rooms r
        LEFT JOIN room_members rm ON r.id = rm.room_id
        LEFT JOIN messages m ON r.id = m.room_id
        WHERE r.id IN (
          SELECT room_id FROM room_members WHERE user_id = $1
        )
        GROUP BY r.id, r.name, r.description, r.type, r.created_at, r.updated_at
        ORDER BY COALESCE(MAX(m.created_at), r.updated_at) DESC
      `, [userId]);

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rooms })
      };
    }

    if (event.httpMethod === 'POST') {
      // Create a new room
      const { name, description, type = 'group', memberIds = [] } = JSON.parse(event.body || '{}');

      if (!name) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Room name is required' })
        };
      }

      // Create the room
      const { data: newRoom } = await client.query(`
        INSERT INTO rooms (name, description, type, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id, name, description, type, created_at
      `, [name, description, type, userId]);

      const roomId = newRoom[0].id;

      // Add creator as a member
      await client.query(`
        INSERT INTO room_members (room_id, user_id, joined_at)
        VALUES ($1, $2, NOW())
      `, [roomId, userId]);

      // Add other members if provided
      if (memberIds.length > 0) {
        for (const memberId of memberIds) {
          if (memberId !== userId) {
            await client.query(`
              INSERT INTO room_members (room_id, user_id, joined_at)
              VALUES ($1, $2, NOW())
            `, [roomId, memberId]);
          }
        }
      }

      return {
        statusCode: 201,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ room: newRoom[0] })
      };
    }

    if (event.httpMethod === 'PUT') {
      // Join a room
      const { roomId } = JSON.parse(event.body || '{}');

      if (!roomId) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Room ID is required' })
        };
      }

      // Check if room exists
      const { data: room } = await client.query(`
        SELECT id, type FROM rooms WHERE id = $1
      `, [roomId]);

      if (!room || room.length === 0) {
        return {
          statusCode: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Room not found' })
        };
      }

      // Check if user is already a member
      const { data: existingMember } = await client.query(`
        SELECT id FROM room_members WHERE room_id = $1 AND user_id = $2
      `, [roomId, userId]);

      if (existingMember && existingMember.length > 0) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Already a member of this room' })
        };
      }

      // Add user to room
      await client.query(`
        INSERT INTO room_members (room_id, user_id, joined_at)
        VALUES ($1, $2, NOW())
      `, [roomId, userId]);

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: 'Successfully joined room' })
      };
    }

    if (event.httpMethod === 'DELETE') {
      // Leave a room
      const { roomId } = JSON.parse(event.body || '{}');

      if (!roomId) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Room ID is required' })
        };
      }

      // Remove user from room
      const { data: result } = await client.query(`
        DELETE FROM room_members WHERE room_id = $1 AND user_id = $2
        RETURNING id
      `, [roomId, userId]);

      if (!result || result.length === 0) {
        return {
          statusCode: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Not a member of this room' })
        };
      }

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: 'Successfully left room' })
      };
    }

    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Rooms error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}
