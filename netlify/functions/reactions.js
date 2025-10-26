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

    if (event.httpMethod === 'GET') {
      // Get reactions for a specific message
      const { messageId } = event.queryStringParameters || {};
      
      if (!messageId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Message ID is required' })
        };
      }

      const reactions = await sql`
        SELECT 
          r.id,
          r.message_id,
          r.user_id,
          r.emoji,
          r.created_at,
          u.name as user_name,
          u.avatar as user_avatar
        FROM message_reactions r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.message_id = ${messageId}
        ORDER BY r.created_at ASC
      `;

      // Group reactions by emoji
      const groupedReactions = reactions.reduce((acc, reaction) => {
        if (!acc[reaction.emoji]) {
          acc[reaction.emoji] = {
            emoji: reaction.emoji,
            count: 0,
            users: []
          };
        }
        acc[reaction.emoji].count++;
        acc[reaction.emoji].users.push({
          id: reaction.user_id,
          name: reaction.user_name,
          avatar: reaction.user_avatar,
          timestamp: reaction.created_at
        });
        return acc;
      }, {});

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          reactions: Object.values(groupedReactions),
          total: reactions.length
        })
      };
    }

    if (event.httpMethod === 'POST') {
      // Add a reaction
      const { messageId, emoji } = JSON.parse(event.body || '{}');
      
      if (!messageId || !emoji) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Message ID and emoji are required' })
        };
      }

      // Check if user already reacted with this emoji
      const existingReaction = await sql`
        SELECT id FROM message_reactions 
        WHERE message_id = ${messageId} AND user_id = ${userId} AND emoji = ${emoji}
      `;

      if (existingReaction.length > 0) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true, 
            action: 'already_exists',
            message: 'Reaction already exists' 
          })
        };
      }

      // Add the reaction
      const newReaction = await sql`
        INSERT INTO message_reactions (message_id, user_id, emoji, created_at)
        VALUES (${messageId}, ${userId}, ${emoji}, NOW())
        RETURNING id, message_id, user_id, emoji, created_at
      `;

      // Get user info for the response
      const user = await sql`SELECT id, name, avatar FROM users WHERE id = ${userId}`;

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          action: 'added',
          reaction: {
            ...newReaction[0],
            user_name: user[0].name,
            user_avatar: user[0].avatar
          }
        })
      };
    }

    if (event.httpMethod === 'DELETE') {
      // Remove a reaction
      const { messageId, emoji } = event.queryStringParameters || {};
      
      if (!messageId || !emoji) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Message ID and emoji are required' })
        };
      }

      // Remove the reaction
      const deletedReaction = await sql`
        DELETE FROM message_reactions 
        WHERE message_id = ${messageId} AND user_id = ${userId} AND emoji = ${emoji}
        RETURNING id, message_id, user_id, emoji, created_at
      `;

      if (deletedReaction.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ 
            success: false,
            action: 'not_found',
            message: 'Reaction not found' 
          })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          action: 'removed',
          reaction: deletedReaction[0]
        })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Reactions API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    };
  }
}