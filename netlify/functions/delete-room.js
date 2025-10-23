import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

export async function handler(event, context) {
  const sql = neon(process.env.NETLIFY_DATABASE_URL);

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
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

    if (event.httpMethod === 'DELETE') {
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

      console.log(`User ${userId} attempting to delete room ${roomId}`);

      // Check if user is a member of the room
      const membership = await sql`
        SELECT rm.user_id, rm.room_id, r.created_by, r.type
        FROM room_members rm
        JOIN rooms r ON rm.room_id = r.id
        WHERE rm.room_id = ${roomId} AND rm.user_id = ${userId}
      `;

      if (membership.length === 0) {
        return {
          statusCode: 403,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'You are not a member of this room' })
        };
      }

      const room = membership[0];

      // For group rooms, only the creator can delete
      if (room.type === 'group' && room.created_by !== userId) {
        return {
          statusCode: 403,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Only the room creator can delete group rooms' })
        };
      }

      // For DM rooms, either user can delete
      if (room.type === 'dm') {
        console.log(`Deleting DM room ${roomId} for user ${userId}`);
      } else {
        console.log(`Deleting group room ${roomId} by creator ${userId}`);
      }

      // Delete in order: messages -> room_members -> rooms
      await sql`DELETE FROM messages WHERE room_id = ${roomId}`;
      console.log(`Deleted messages for room ${roomId}`);

      await sql`DELETE FROM room_members WHERE room_id = ${roomId}`;
      console.log(`Deleted room members for room ${roomId}`);

      await sql`DELETE FROM rooms WHERE id = ${roomId}`;
      console.log(`Deleted room ${roomId}`);

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Room deleted successfully',
          roomId: roomId,
          deletedBy: userId
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
    console.error('Delete room error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Failed to delete room',
        details: error.message
      })
    };
  }
}
