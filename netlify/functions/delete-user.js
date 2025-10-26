import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

export async function handler(event, context) {
  // Configure neon with the database URL
  const sql = neon(process.env.NETLIFY_DATABASE_URL);

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
        'Access-Control-Allow-Credentials': 'true'
      },
      body: ''
    };
  }

  // Accept both DELETE and GET for easier testing
  if (event.httpMethod !== 'DELETE' && event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
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
    const { targetUserId } = JSON.parse(event.body || '{}');

    // If no targetUserId provided, delete the current user
    const deleteUserId = targetUserId || userId;

    console.log(`Deleting user ${deleteUserId}...`);

    // Delete user's data in order to respect foreign key constraints
    // 1. Delete user's messages
    await sql`DELETE FROM messages WHERE user_id = ${deleteUserId}`;
    
    // 2. Delete user from room_members
    await sql`DELETE FROM room_members WHERE user_id = ${deleteUserId}`;
    
    // 3. Delete rooms created by user
    await sql`DELETE FROM rooms WHERE created_by = ${deleteUserId}`;
    
    // 4. Delete the user
    await sql`DELETE FROM users WHERE id = ${deleteUserId}`;

    console.log(`User ${deleteUserId} deleted successfully`);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'User deleted successfully',
        deletedUserId: deleteUserId,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('User deletion error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'User deletion failed',
        details: error.message
      })
    };
  }
}
