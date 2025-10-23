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
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

    if (event.httpMethod === 'GET') {
      // Get current user profile
      const user = await sql`
        SELECT id, email, name, avatar, online, last_seen, created_at
        FROM users WHERE id = ${userId}
      `;

      if (!user || user.length === 0) {
        return {
          statusCode: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'User not found' })
        };
      }

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user: user[0] })
      };
    }

    if (event.httpMethod === 'PUT') {
      // Update user profile
      const { name, avatar } = JSON.parse(event.body || '{}');

      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      if (name !== undefined) {
        updateFields.push(`name = $${paramCount}`);
        updateValues.push(name);
        paramCount++;
      }

      if (avatar !== undefined) {
        updateFields.push(`avatar = $${paramCount}`);
        updateValues.push(avatar);
        paramCount++;
      }

      if (updateFields.length === 0) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'No fields to update' })
        };
      }

      updateValues.push(userId);

      const updatedUser = await sql`
        UPDATE users 
        SET ${updateFields.join(', ')}, updated_at = NOW()
        WHERE id = ${userId}
        RETURNING id, email, name, avatar, online, last_seen, created_at
      `;

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user: updatedUser[0] })
      };
    }

    if (event.httpMethod === 'POST') {
      // Search users
      const { query, limit = 20 } = JSON.parse(event.body || '{}');

      if (!query || query.trim().length < 2) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Search query must be at least 2 characters' })
        };
      }

      const users = await sql`
        SELECT id, name, avatar, online, last_seen
        FROM users 
        WHERE (name ILIKE ${`%${query}%`} OR email ILIKE ${`%${query}%`}) AND id != ${userId}
        ORDER BY 
          CASE WHEN online = true THEN 0 ELSE 1 END,
          name ASC
        LIMIT ${limit}
      `;

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ users })
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
    console.error('Users error:', error);
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
