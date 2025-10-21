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
      // Get messages for a room
      const { roomId } = event.queryStringParameters || {};
      
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

      // Check if user has access to the room
      const { data: roomAccess } = await client.query(`
        SELECT id FROM room_members WHERE room_id = $1 AND user_id = $2
      `, [roomId, userId]);

      if (!roomAccess || roomAccess.length === 0) {
        return {
          statusCode: 403,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Access denied to this room' })
        };
      }

      const { data: messages } = await client.query(`
        SELECT 
          m.id,
          m.content,
          m.type,
          m.created_at,
          m.read_by,
          u.id as user_id,
          u.name as user_name,
          u.avatar as user_avatar
        FROM messages m
        JOIN users u ON m.user_id = u.id
        WHERE m.room_id = $1
        ORDER BY m.created_at ASC
      `, [roomId]);

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages })
      };
    }

    if (event.httpMethod === 'POST') {
      // Send a new message
      const { roomId, content, type = 'text' } = JSON.parse(event.body || '{}');

      if (!roomId || !content) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Room ID and content are required' })
        };
      }

      // Check if user has access to the room
      const { data: roomAccess } = await client.query(`
        SELECT id FROM room_members WHERE room_id = $1 AND user_id = $2
      `, [roomId, userId]);

      if (!roomAccess || roomAccess.length === 0) {
        return {
          statusCode: 403,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Access denied to this room' })
        };
      }

      const { data: newMessage } = await client.query(`
        INSERT INTO messages (room_id, user_id, content, type, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id, content, type, created_at
      `, [roomId, userId, content, type]);

      // Get user info for the response
      const { data: user } = await client.query(`
        SELECT id, name, avatar FROM users WHERE id = $1
      `, [userId]);

      const messageWithUser = {
        ...newMessage[0],
        user_id: user[0].id,
        user_name: user[0].name,
        user_avatar: user[0].avatar,
        read_by: []
      };

      return {
        statusCode: 201,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: messageWithUser })
      };
    }

    if (event.httpMethod === 'PUT') {
      // Mark messages as read
      const { messageIds } = JSON.parse(event.body || '{}');

      if (!messageIds || !Array.isArray(messageIds)) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Message IDs array is required' })
        };
      }

      // Update read status for messages
      const { data: updatedMessages } = await client.query(`
        UPDATE messages 
        SET read_by = array_append(COALESCE(read_by, '{}'), $1)
        WHERE id = ANY($2) AND NOT ($1 = ANY(COALESCE(read_by, '{}')))
        RETURNING id
      `, [userId, messageIds]);

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          updatedCount: updatedMessages.length,
          message: 'Messages marked as read'
        })
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
    console.error('Messages error:', error);
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
