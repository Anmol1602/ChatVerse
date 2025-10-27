const { neon } = require('@neondatabase/serverless')
const jwt = require('jsonwebtoken')

exports.handler = async (event, context) => {
  const sql = neon(process.env.NETLIFY_DATABASE_URL)
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      },
      body: '',
    }
  }

  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  try {
    // Verify JWT token
    const authHeader = event.headers.authorization || event.headers.Authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        },
        body: JSON.stringify({ error: 'Unauthorized' }),
      }
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const currentUserId = decoded.userId

    // Get roomId from query parameters
    const { roomId } = event.queryStringParameters || {}

    if (!roomId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        },
        body: JSON.stringify({ error: 'Missing roomId' }),
      }
    }

    // Check if user is a member of the room
    const memberCheck = await sql`
      SELECT rm.user_id, r.admin_id, r.type
      FROM room_members rm
      JOIN rooms r ON rm.room_id = r.id
      WHERE rm.room_id = ${roomId} AND rm.user_id = ${currentUserId}
    `

    if (memberCheck.length === 0) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        },
        body: JSON.stringify({ error: 'User is not a member of this room' }),
      }
    }

    const room = memberCheck[0]

    // If user is admin, transfer admin role to another member
    if (room.admin_id === currentUserId) {
      // Find another member to make admin
      const otherMembers = await sql`
        SELECT user_id FROM room_members 
        WHERE room_id = ${roomId} AND user_id != ${currentUserId}
        ORDER BY joined_at ASC
        LIMIT 1
      `

      if (otherMembers.length > 0) {
        // Transfer admin role to another member
        await sql`
          UPDATE rooms 
          SET admin_id = ${otherMembers[0].user_id}, updated_at = NOW()
          WHERE id = ${roomId}
        `
      } else {
        // If no other members, delete the room
        await sql`DELETE FROM rooms WHERE id = ${roomId}`
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          },
          body: JSON.stringify({ 
            success: true, 
            message: 'Room deleted as you were the only member' 
          }),
        }
      }
    }

    // Remove user from room
    await sql`
      DELETE FROM room_members 
      WHERE room_id = ${roomId} AND user_id = ${currentUserId}
    `

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      },
      body: JSON.stringify({ 
        success: true, 
        message: 'Successfully left the room' 
      }),
    }

  } catch (error) {
    console.error('Leave room error:', error)
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    }
  }
}
