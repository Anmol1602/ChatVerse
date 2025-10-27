import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

export async function handler(event, context) {
  console.log('Room members function called with method:', event.httpMethod);
  console.log('Event headers:', event.headers);
  console.log('Query parameters:', event.queryStringParameters);
  
  const sql = neon(process.env.NETLIFY_DATABASE_URL);

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Credentials': 'true'
      },
      body: ''
    };
  }

  try {
    const token = event.headers.authorization?.replace('Bearer ', '') ||
                  event.headers.cookie?.split('token=')[1]?.split(';')[0];

    console.log('Token found:', !!token);

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
      console.log('Token decoded successfully for user:', decoded.id);
    } catch (error) {
      console.error('Token verification failed:', error);
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    const currentUserId = decoded.id;

    if (event.httpMethod === 'GET') {
      // Get room members
      const { roomId } = event.queryStringParameters || {};
      
      console.log('GET room-members request for roomId:', roomId);
      console.log('Current user ID:', currentUserId);
      
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

      // Check if user is a member of the room
      let membership;
      try {
        console.log('Checking membership for roomId:', roomId, 'userId:', currentUserId);
        membership = await sql`
          SELECT 1 FROM room_members 
          WHERE room_id = ${roomId} AND user_id = ${currentUserId}
        `;
        console.log('Membership check result:', membership);
      } catch (error) {
        console.error('Error checking membership:', error);
        return {
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Database error during membership check', details: error.message })
        };
      }

      if (!membership || membership.length === 0) {
        console.log('User is not a member of this room');
        return {
          statusCode: 403,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Not a member of this room' })
        };
      }

      let members, room;
      try {
        console.log('Fetching members and room info for roomId:', roomId);
        
        // Get room information first
        try {
          room = await sql`
            SELECT id, name, description, COALESCE(admin_id, created_by) as admin_id, type, created_at
            FROM rooms
            WHERE id = ${roomId}
          `;
          console.log('Room query result:', room);
        } catch (roomError) {
          console.error('Error fetching room:', roomError);
          return {
            statusCode: 500,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ error: 'Database error during room fetch', details: roomError.message })
          };
        }
        
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
        
        // Get members first, then add admin status
        try {
          members = await sql`
            SELECT 
              u.id,
              u.name,
              u.avatar,
              u.online,
              u.last_seen,
              rm.joined_at
            FROM room_members rm
            JOIN users u ON rm.user_id = u.id
            WHERE rm.room_id = ${roomId}
            ORDER BY rm.joined_at ASC
          `;
          
          // Add admin status to each member
          const adminId = room[0].admin_id;
          members = members.map(member => ({
            ...member,
            is_admin: member.id === adminId
          }));
          
          console.log('Found members:', members);
        } catch (memberError) {
          console.error('Error fetching members:', memberError);
          return {
            statusCode: 500,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ error: 'Database error during members fetch', details: memberError.message })
          };
        }
      } catch (error) {
        console.error('General error:', error);
        return {
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Database error during members fetch', details: error.message })
        };
      }

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: true,
          members,
          room: room[0] || null
        })
      };
    }

    if (event.httpMethod === 'POST') {
      // Add member to room
      const { roomId, userId } = JSON.parse(event.body || '{}');
      
      if (!roomId || !userId) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Room ID and User ID are required' })
        };
      }

      // Check if current user is a member of the room
      const membership = await sql`
        SELECT 1 FROM room_members 
        WHERE room_id = ${roomId} AND user_id = ${currentUserId}
      `;

      if (!membership || membership.length === 0) {
        return {
          statusCode: 403,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Not a member of this room' })
        };
      }

      // Check if user is already a member
      const existingMember = await sql`
        SELECT 1 FROM room_members 
        WHERE room_id = ${roomId} AND user_id = ${userId}
      `;

      if (existingMember && existingMember.length > 0) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'User is already a member of this room' })
        };
      }

      // Add user to room
      await sql`
        INSERT INTO room_members (room_id, user_id, joined_at)
        VALUES (${roomId}, ${userId}, NOW())
      `;

      // Get the added user's info
      const addedUser = await sql`
        SELECT id, name, avatar, online, last_seen
        FROM users WHERE id = ${userId}
      `;

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          message: 'User added to room successfully',
          user: addedUser[0]
        })
      };
    }

    if (event.httpMethod === 'DELETE') {
      // Remove member from room
      const { roomId, userId } = event.queryStringParameters || {};
      
      if (!roomId || !userId) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Room ID and User ID are required' })
        };
      }

      // Check if current user is admin of the room
      const roomCheck = await sql`
        SELECT COALESCE(admin_id, created_by) as admin_id FROM rooms WHERE id = ${roomId}
      `;

      if (roomCheck.length === 0) {
        return {
          statusCode: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Room not found' })
        };
      }

      if (roomCheck[0].admin_id !== currentUserId) {
        return {
          statusCode: 403,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Only admin can remove members' })
        };
      }

      // Check if user to be removed is a member
      const memberCheck = await sql`
        SELECT user_id FROM room_members 
        WHERE room_id = ${roomId} AND user_id = ${userId}
      `;

      if (memberCheck.length === 0) {
        return {
          statusCode: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'User is not a member of this room' })
        };
      }

      // Remove user from room
      await sql`
        DELETE FROM room_members 
        WHERE room_id = ${roomId} AND user_id = ${userId}
      `;

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: true,
          message: 'User removed from room successfully' 
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
    console.error('Room members error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Failed to manage room members', details: error.message })
    };
  }
}
