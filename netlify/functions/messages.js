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
      const roomAccess = await sql`SELECT id FROM room_members WHERE room_id = ${roomId} AND user_id = ${userId}`;

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

      const messages = await sql`
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
        WHERE m.room_id = ${roomId}
        ORDER BY m.created_at ASC
      `;

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
      const roomAccess = await sql`SELECT id FROM room_members WHERE room_id = ${roomId} AND user_id = ${userId}`;

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

      const newMessage = await sql`
        INSERT INTO messages (room_id, user_id, content, type, created_at)
        VALUES (${roomId}, ${userId}, ${content}, ${type}, NOW())
        RETURNING id, content, type, created_at
      `;

      // Get user info for the response
      const user = await sql`SELECT id, name, avatar FROM users WHERE id = ${userId}`;

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
      const updatedMessages = await sql`
        UPDATE messages 
        SET read_by = array_append(COALESCE(read_by, '{}'), ${userId})
        WHERE id = ANY(${messageIds}) AND NOT (${userId} = ANY(COALESCE(read_by, '{}')))
        RETURNING id
      `;

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

    if (event.httpMethod === 'DELETE') {
      // Delete a message
      const { messageId } = JSON.parse(event.body || '{}');

      if (!messageId) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Message ID is required' })
        };
      }

      // Check if user is the author of the message
      const message = await sql`
        SELECT user_id, room_id FROM messages WHERE id = ${messageId}
      `;

      if (!message || message.length === 0) {
        return {
          statusCode: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Message not found' })
        };
      }

      // Check if user is the author of the message
      const isAuthor = message[0].user_id === userId;

      if (!isAuthor) {
        return {
          statusCode: 403,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'You can only delete your own messages' })
        };
      }

      // Delete the message
      await sql`DELETE FROM messages WHERE id = ${messageId}`;

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: 'Message deleted successfully' })
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