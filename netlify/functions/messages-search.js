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
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

    if (event.httpMethod === 'GET') {
      const { roomId, q } = event.queryStringParameters || {};
      
      if (!roomId || !q) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Room ID and search query are required' })
        };
      }

      // Check if user has access to the room
      const roomAccess = await sql`
        SELECT id FROM room_members 
        WHERE room_id = ${roomId} AND user_id = ${userId}
      `;

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

      // Search messages with case-insensitive text search
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
          AND m.type = 'text'
          AND LOWER(m.content) LIKE LOWER(${'%' + q + '%'})
        ORDER BY m.created_at DESC
        LIMIT 50
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

    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Messages search error:', error);
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
