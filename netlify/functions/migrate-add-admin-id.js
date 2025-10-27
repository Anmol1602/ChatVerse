const { neon } = require('@neondatabase/serverless')

exports.handler = async (event, context) => {
  const sql = neon(process.env.NETLIFY_DATABASE_URL)

  try {
    console.log('Adding admin_id column to rooms table...')
    
    // Add admin_id column to rooms table
    await sql`
      ALTER TABLE rooms 
      ADD COLUMN IF NOT EXISTS admin_id INTEGER REFERENCES users(id)
    `
    
    console.log('admin_id column added successfully')
    
    // Update existing rooms to set admin_id to created_by
    await sql`
      UPDATE rooms 
      SET admin_id = created_by 
      WHERE admin_id IS NULL
    `
    
    console.log('Updated existing rooms with admin_id')
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true, 
        message: 'admin_id column added to rooms table successfully' 
      })
    }
  } catch (error) {
    console.error('Migration error:', error)
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: false, 
        error: 'Migration failed', 
        details: error.message 
      })
    }
  }
}
