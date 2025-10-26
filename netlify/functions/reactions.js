import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

const sql = neon(process.env.NETLIFY_DATABASE_URL);

export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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
      // Add reaction
      const { messageId, emoji } = JSON.parse(event.body || '{}');

      if (!messageId || !emoji) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Message ID and emoji are required' })
        };
      }

      // Check if user has access to the message
      const messageAccess = await sql`
        SELECT m.id, rm.role
        FROM messages m
        JOIN room_members rm ON m.room_id = rm.room_id AND rm.user_id = ${userId}
        WHERE m.id = ${messageId}
      `;

      if (!messageAccess || messageAccess.length === 0) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'Access denied to this message' })
        };
      }

      // Check if user already reacted with this emoji
      const existingReaction = await sql`
        SELECT id FROM message_reactions 
        WHERE message_id = ${messageId} AND user_id = ${userId} AND emoji = ${emoji}
      `;

      if (existingReaction && existingReaction.length > 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'User already reacted with this emoji' })
        };
      }

      // Add reaction
      const newReaction = await sql`
        INSERT INTO message_reactions (message_id, user_id, emoji, created_at)
        VALUES (${messageId}, ${userId}, ${emoji}, NOW())
        RETURNING id, emoji, created_at
      `;

      // Get user info for the response
      const user = await sql`SELECT id, name, avatar FROM users WHERE id = ${userId}`;

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          reaction: {
            ...newReaction[0],
            user_id: user[0].id,
            user_name: user[0].name,
            user_avatar: user[0].avatar
          }
        })
      };
    }

    if (event.httpMethod === 'DELETE') {
      // Remove reaction
      const { messageId, emoji } = JSON.parse(event.body || '{}');

      if (!messageId || !emoji) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Message ID and emoji are required' })
        };
      }

      // Remove reaction
      await sql`
        DELETE FROM message_reactions 
        WHERE message_id = ${messageId} AND user_id = ${userId} AND emoji = ${emoji}
      `;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Reaction removed successfully' })
      };
    }

    if (event.httpMethod === 'GET') {
      // Get reactions for a message
      const { messageId } = event.queryStringParameters || {};

      if (!messageId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Message ID is required' })
        };
      }

      // Check if user has access to the message
      const messageAccess = await sql`
        SELECT m.id, rm.role
        FROM messages m
        JOIN room_members rm ON m.room_id = rm.room_id AND rm.user_id = ${userId}
        WHERE m.id = ${messageId}
      `;

      if (!messageAccess || messageAccess.length === 0) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'Access denied to this message' })
        };
      }

      // Get reactions
      const reactions = await sql`
        SELECT 
          mr.id,
          mr.emoji,
          mr.created_at,
          u.id as user_id,
          u.name as user_name,
          u.avatar as user_avatar
        FROM message_reactions mr
        JOIN users u ON mr.user_id = u.id
        WHERE mr.message_id = ${messageId}
        ORDER BY mr.created_at ASC
      `;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ reactions })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Reactions error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
}
