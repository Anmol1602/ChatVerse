const { neon } = require('@neondatabase/serverless')

exports.handler = async (event, context) => {
  const sql = neon(process.env.NETLIFY_DATABASE_URL)

  try {
    console.log('Checking rooms table schema...')
    
    // Get table structure
    const schema = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'rooms'
      ORDER BY ordinal_position
    `
    
    console.log('Rooms table schema:', schema)
    
    // Try to get a sample room
    const sampleRoom = await sql`
      SELECT * FROM rooms LIMIT 1
    `
    
    console.log('Sample room:', sampleRoom)
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true, 
        schema,
        sampleRoom: sampleRoom[0] || null
      })
    }
  } catch (error) {
    console.error('Schema check error:', error)
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: false, 
        error: 'Schema check failed', 
        details: error.message 
      })
    }
  }
}
