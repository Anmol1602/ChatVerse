import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

// In-memory store for active connections (in production, use Redis or similar)
const activeConnections = new Map();

export async function handler(event, context) {
  const sql = neon(process.env.NETLIFY_DATABASE_URL);

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Credentials': 'true'
      },
      body: ''
    };
  }

  try {
    if (event.httpMethod === 'POST') {
      // Broadcast a message to all users in a room
      const { roomId, message, userId } = JSON.parse(event.body);
      
      // Get all users in the room
      const roomUsers = await sql`
        SELECT DISTINCT u.id, u.name, u.email
        FROM users u
        JOIN room_members rm ON u.id = rm.user_id
        WHERE rm.room_id = ${roomId}
      `;

      // Broadcast to all active connections in the room
      const broadcastData = {
        type: 'new_message',
        roomId,
        message,
        userId,
        timestamp: new Date().toISOString()
      };

      // Message is already stored by the /messages endpoint
      // No need to store it again here

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Message broadcasted successfully',
          roomUsers: roomUsers.length,
          broadcastData
        })
      };

    } else if (event.httpMethod === 'GET') {
      // Server-Sent Events endpoint for real-time updates
      const roomId = event.queryStringParameters?.roomId;
      const token = event.headers.authorization?.replace('Bearer ', '') || 
                    event.headers.cookie?.split('token=')[1]?.split(';')[0];

      if (!token || !roomId) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Missing token or roomId' })
        };
      }

      // Verify token
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

      // Return SSE headers
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        },
        body: `data: ${JSON.stringify({
          type: 'connection_established',
          roomId,
          userId: decoded.id,
          timestamp: new Date().toISOString()
        })}\n\n`
      };
    }

  } catch (error) {
    console.error('Broadcast error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Broadcast failed',
        details: error.message
      })
    };
  }
}
