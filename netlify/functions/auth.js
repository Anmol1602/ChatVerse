import { client } from '@netlify/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';

const corsHandler = cors({
  origin: true,
  credentials: true
});

export async function handler(event, context) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Credentials': 'true'
      },
      body: ''
    };
  }

  try {
    const { action, email, password, name, avatar } = JSON.parse(event.body || '{}');

    if (action === 'register') {
      // Register new user
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const { data: existingUser } = await client.query(`
        SELECT id FROM users WHERE email = $1
      `, [email]);

      if (existingUser && existingUser.length > 0) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'User already exists' })
        };
      }

      const { data: newUser } = await client.query(`
        INSERT INTO users (email, password, name, avatar, online, created_at)
        VALUES ($1, $2, $3, $4, true, NOW())
        RETURNING id, email, name, avatar, online
      `, [email, hashedPassword, name, avatar || '']);

      const token = jwt.sign(
        { id: newUser[0].id, email: newUser[0].email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        statusCode: 201,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
          'Set-Cookie': `token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`
        },
        body: JSON.stringify({
          user: newUser[0],
          token
        })
      };
    }

    if (action === 'login') {
      // Login existing user
      const { data: user } = await client.query(`
        SELECT id, email, password, name, avatar, online FROM users WHERE email = $1
      `, [email]);

      if (!user || user.length === 0) {
        return {
          statusCode: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Invalid credentials' })
        };
      }

      const isValidPassword = await bcrypt.compare(password, user[0].password);
      if (!isValidPassword) {
        return {
          statusCode: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Invalid credentials' })
        };
      }

      // Update user online status
      await client.query(`
        UPDATE users SET online = true, last_seen = NOW() WHERE id = $1
      `, [user[0].id]);

      const token = jwt.sign(
        { id: user[0].id, email: user[0].email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const { password: _, ...userWithoutPassword } = user[0];

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
          'Set-Cookie': `token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`
        },
        body: JSON.stringify({
          user: userWithoutPassword,
          token
        })
      };
    }

    if (action === 'logout') {
      const token = event.headers.authorization?.replace('Bearer ', '');
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          await client.query(`
            UPDATE users SET online = false, last_seen = NOW() WHERE id = $1
          `, [decoded.id]);
        } catch (error) {
          // Token invalid, continue with logout
        }
      }

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
          'Set-Cookie': 'token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
        },
        body: JSON.stringify({ message: 'Logged out successfully' })
      };
    }

    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Invalid action' })
    };

  } catch (error) {
    console.error('Auth error:', error);
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
