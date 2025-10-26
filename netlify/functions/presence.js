import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

const sql = neon(process.env.NETLIFY_DATABASE_URL);

export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Credentials': 'true'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const token = event.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'No token provided' })
      };
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    if (event.httpMethod === 'POST') {
      // Update user online status
      const { status } = JSON.parse(event.body || '{}');
      
      await sql`
        UPDATE users 
        SET online = ${status === 'online'}, last_seen = NOW()
        WHERE id = ${userId}
      `;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          message: 'Presence updated successfully',
          status: status === 'online' ? 'online' : 'offline'
        })
      };
    }

    if (event.httpMethod === 'PUT') {
      // Heartbeat - update last_seen
      await sql`
        UPDATE users 
        SET last_seen = NOW()
        WHERE id = ${userId}
      `;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Heartbeat updated' })
      };
    }

    if (event.httpMethod === 'GET') {
      // Get online users
      const { roomId } = event.queryStringParameters || {};

      let query;
      if (roomId) {
        // Get online users in a specific room
        query = sql`
          SELECT DISTINCT u.id, u.name, u.avatar, u.online, u.last_seen
          FROM users u
          JOIN room_members rm ON u.id = rm.user_id
          WHERE rm.room_id = ${roomId} AND u.id != ${userId}
          ORDER BY u.online DESC, u.last_seen DESC
        `;
      } else {
        // Get all online users
        query = sql`
          SELECT id, name, avatar, online, last_seen
          FROM users
          WHERE id != ${userId}
          ORDER BY online DESC, last_seen DESC
        `;
      }

      const users = await query;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ users })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Presence error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
}
