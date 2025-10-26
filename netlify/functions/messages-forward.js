import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

export async function handler(event, context) {
  const sql = neon(process.env.NETLIFY_DATABASE_URL);

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Credentials': 'true'
      },
      body: ''
    };
  }

  try {
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

    if (event.httpMethod === 'POST') {
      const { messageId, targetRoomId } = JSON.parse(event.body || '{}');

      if (!messageId || !targetRoomId) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Message ID and target room ID are required' })
        };
      }

      // Get the original message
      const originalMessage = await sql`
        SELECT m.*, u.name as user_name
        FROM messages m
        JOIN users u ON m.user_id = u.id
        WHERE m.id = ${messageId}
      `;

      if (!originalMessage || originalMessage.length === 0) {
        return {
          statusCode: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Message not found' })
        };
      }

      // Check if user has access to the original message
      const originalRoomAccess = await sql`
        SELECT id FROM room_members 
        WHERE room_id = ${originalMessage[0].room_id} AND user_id = ${userId}
      `;

      if (!originalRoomAccess || originalRoomAccess.length === 0) {
        return {
          statusCode: 403,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Access denied to original message' })
        };
      }

      // Check if user has access to the target room
      const targetRoomAccess = await sql`
        SELECT id FROM room_members 
        WHERE room_id = ${targetRoomId} AND user_id = ${userId}
      `;

      if (!targetRoomAccess || targetRoomAccess.length === 0) {
        return {
          statusCode: 403,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Access denied to target room' })
        };
      }

      // Create forwarded message content
      const forwardedContent = `Forwarded from ${originalMessage[0].user_name}:\n${originalMessage[0].content}`;

      // Insert the forwarded message
      const newMessage = await sql`
        INSERT INTO messages (room_id, user_id, content, type, created_at)
        VALUES (${targetRoomId}, ${userId}, ${forwardedContent}, 'text', NOW())
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
        body: JSON.stringify({ 
          success: true,
          message: messageWithUser 
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
    console.error('Messages forward error:', error);
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
