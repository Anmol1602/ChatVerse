import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

const sql = neon(process.env.NETLIFY_DATABASE_URL);

export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
      let fileData, fileName, fileType, roomId;

      // Check if it's JSON (new format) or multipart (old format)
      if (event.headers['content-type']?.includes('application/json')) {
        // New JSON format
        const body = JSON.parse(event.body || '{}');
        fileData = body.fileData;
        fileName = body.fileName;
        fileType = body.fileType;
        roomId = body.roomId;
      } else if (event.headers['content-type']?.includes('multipart/form-data')) {
        // Old multipart format - simplified parsing
        try {
          const boundary = event.headers['content-type']?.split('boundary=')[1];
          if (!boundary) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'No boundary found in content-type' })
            };
          }

          const parts = event.body.split(`--${boundary}`);
          
          for (const part of parts) {
            if (part.includes('name="file"')) {
              // Extract filename
              const filenameMatch = part.match(/filename="([^"]+)"/);
              if (filenameMatch) {
                fileName = filenameMatch[1];
              }
              
              // Extract content type
              const contentTypeMatch = part.match(/Content-Type:\s*([^\r\n]+)/);
              if (contentTypeMatch) {
                fileType = contentTypeMatch[1];
              }
              
              // Extract file content
              const contentStart = part.indexOf('\r\n\r\n');
              if (contentStart !== -1) {
                const content = part.substring(contentStart + 4);
                const contentEnd = content.lastIndexOf('\r\n');
                if (contentEnd !== -1) {
                  const binaryData = content.substring(0, contentEnd);
                  fileData = Buffer.from(binaryData, 'binary').toString('base64');
                }
              }
            } else if (part.includes('name="roomId"')) {
              const contentStart = part.indexOf('\r\n\r\n');
              if (contentStart !== -1) {
                const content = part.substring(contentStart + 4);
                const contentEnd = content.lastIndexOf('\r\n');
                if (contentEnd !== -1) {
                  roomId = content.substring(0, contentEnd);
                }
              }
            }
          }
        } catch (parseError) {
          console.error('Multipart parsing error:', parseError);
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Failed to parse multipart data' })
          };
        }
      } else {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Unsupported content type' })
        };
      }

      if (!fileData || !fileName || !roomId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Missing file data, filename, or room ID',
            debug: { hasFileData: !!fileData, hasFileName: !!fileName, hasRoomId: !!roomId }
          })
        };
      }

      // Validate file size (10MB limit)
      const fileSize = Buffer.byteLength(fileData, 'base64');
      if (fileSize > 10 * 1024 * 1024) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'File size exceeds 10MB limit' })
        };
      }

      // Check if user has access to the room
      const roomAccess = await sql`
        SELECT 1 FROM room_members 
        WHERE room_id = ${roomId} AND user_id = ${userId}
      `;

      if (!roomAccess || roomAccess.length === 0) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'Access denied to this room' })
        };
      }

      // Store file data as data URL
      const fileUrl = `data:${fileType};base64,${fileData}`;

      // Insert file record into files table (id will be auto-generated)
      const newFile = await sql`
        INSERT INTO files (name, type, size, url, uploaded_by, room_id, created_at)
        VALUES (${fileName}, ${fileType}, ${fileSize}, ${fileUrl}, ${userId}, ${roomId}, NOW())
        RETURNING id, name, type, size, url
      `;

      // Insert file message into messages table with reference to file
      const newMessage = await sql`
        INSERT INTO messages (room_id, user_id, content, type, file_id, created_at)
        VALUES (${roomId}, ${userId}, ${JSON.stringify({
          file: {
            id: newFile[0].id,
            name: newFile[0].name,
            type: newFile[0].type,
            size: newFile[0].size,
            url: newFile[0].url
          }
        })}, 'file', ${newFile[0].id}, NOW())
        RETURNING id, content, type, file_id, created_at
      `;

      // Get user info for the response
      const user = await sql`SELECT id, name, avatar FROM users WHERE id = ${userId}`;

      const messageWithUser = {
        ...newMessage[0],
        user_id: user[0].id,
        user_name: user[0].name,
        user_avatar: user[0].avatar,
        read_by: []
      };

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ 
          success: true,
          message: messageWithUser 
        })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Upload file error:', error);
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