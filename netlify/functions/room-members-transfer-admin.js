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

  if (event.httpMethod !== 'POST') {
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
    const currentUserId = decoded.id

    console.log('Transfer admin request - decoded token:', decoded)
    console.log('Transfer admin request - currentUserId:', currentUserId)

    // Parse request body
    const { roomId, newAdminId } = JSON.parse(event.body)
    console.log('Transfer admin request - roomId:', roomId)
    console.log('Transfer admin request - newAdminId:', newAdminId)
    console.log('Transfer admin request - event.body:', event.body)

    if (!roomId || !newAdminId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        },
        body: JSON.stringify({ error: 'Missing roomId or newAdminId' }),
      }
    }

    // Check if current user is admin of the room
    const roomCheck = await sql`
      SELECT created_by as admin_id FROM rooms WHERE id = ${roomId}
    `

    if (roomCheck.length === 0) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        },
        body: JSON.stringify({ error: 'Room not found' }),
      }
    }

    if (roomCheck[0].admin_id !== currentUserId) {
      return {
        statusCode: 403,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        },
        body: JSON.stringify({ error: 'Only admin can transfer admin role' }),
      }
    }

    // Check if new admin is a member of the room
    const memberCheck = await sql`
      SELECT user_id FROM room_members 
      WHERE room_id = ${roomId} AND user_id = ${newAdminId}
    `

    if (memberCheck.length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        },
        body: JSON.stringify({ error: 'New admin must be a member of the room' }),
      }
    }

    // Transfer admin role
    await sql`
      UPDATE rooms 
      SET admin_id = ${newAdminId}, updated_at = NOW()
      WHERE id = ${roomId}
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
        message: 'Admin role transferred successfully' 
      }),
    }

  } catch (error) {
    console.error('Transfer admin error:', error)
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
