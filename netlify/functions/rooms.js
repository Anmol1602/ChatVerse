import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

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
      try {
        // Get user's rooms
        console.log('Fetching rooms for user:', userId);
        const rooms = await sql`
        SELECT 
          r.id,
          r.name,
          r.description,
          r.type,
          r.created_at,
          r.updated_at,
          (SELECT COUNT(*) FROM room_members rm2 WHERE rm2.room_id = r.id) as member_count,
          MAX(m.created_at) as last_message_at,
          COALESCE(
            (SELECT COUNT(*) FROM messages m2 
             WHERE m2.room_id = r.id 
             AND m2.user_id != ${userId}
             AND m2.created_at > COALESCE(
               (SELECT rm.last_read_at FROM room_members rm 
                WHERE rm.room_id = r.id AND rm.user_id = ${userId}), 
               (SELECT rm3.joined_at FROM room_members rm3 
                WHERE rm3.room_id = r.id AND rm3.user_id = ${userId})
             )
            ), 0
          ) as unread_count
        FROM rooms r
        LEFT JOIN messages m ON r.id = m.room_id
        WHERE r.id IN (
          SELECT room_id FROM room_members WHERE user_id = ${userId}
        )
        GROUP BY r.id, r.name, r.description, r.type, r.created_at, r.updated_at
        ORDER BY COALESCE(MAX(m.created_at), r.updated_at) DESC
      `;

      console.log('Successfully fetched rooms:', rooms.length);
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rooms })
      };
      } catch (error) {
        console.error('Error fetching rooms:', error);
        return {
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            error: 'Failed to fetch rooms',
            details: error.message 
          })
        };
      }
    }

    if (event.httpMethod === 'POST') {
      // Create a new room
      const { name, description, type = 'group', memberIds = [] } = JSON.parse(event.body || '{}');

      console.log('Creating room with data:', { name, description, type, memberIds, userId });

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
      const newRoom = await sql`
        INSERT INTO rooms (name, description, type, created_by, created_at, updated_at)
        VALUES (${name}, ${description}, ${type}, ${userId}, NOW(), NOW())
        RETURNING id, name, description, type, created_at
      `;

      const roomId = newRoom[0].id;
      console.log('Room created with ID:', roomId);

      // Add creator as a member
      await sql`
        INSERT INTO room_members (room_id, user_id, joined_at)
        VALUES (${roomId}, ${userId}, NOW())
      `;
      console.log('Creator added as member');

      // Add other members if provided
      if (memberIds.length > 0) {
        console.log('Adding members:', memberIds);
        for (const memberId of memberIds) {
          if (memberId !== userId) {
            await sql`
              INSERT INTO room_members (room_id, user_id, joined_at)
              VALUES (${roomId}, ${memberId}, NOW())
            `;
            console.log('Member added:', memberId);
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
      const room = await sql`
        SELECT id, type FROM rooms WHERE id = ${roomId}
      `;

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
      const existingMember = await sql`
        SELECT id FROM room_members WHERE room_id = ${roomId} AND user_id = ${userId}
      `;

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
      await sql`
        INSERT INTO room_members (room_id, user_id, joined_at)
        VALUES (${roomId}, ${userId}, NOW())
      `;

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
      const result = await sql`
        DELETE FROM room_members WHERE room_id = ${roomId} AND user_id = ${userId}
        RETURNING id
      `;

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
