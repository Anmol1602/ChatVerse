# 🔧 Netlify Environment Variables Setup

## Required Environment Variables for ChatVerse

Add these environment variables in your Netlify dashboard:

### 1. Database Connection
```
NETLIFY_DATABASE_URL=your_database_url_from_netlify_dashboard
```

### 2. JWT Secret (Generate a strong secret)
```
JWT_SECRET=your_super_secret_jwt_key_here_make_it_very_long_and_random
```

### 3. Frontend API URLs
```
VITE_API_URL=https://chatverse12.netlify.app/api
VITE_WS_URL=wss://chatverse12.netlify.app
```

## Steps to Configure:

1. **Go to Netlify Dashboard**: https://app.netlify.com/projects/chatverse12/configuration/env
2. **Add Environment Variables**:
   - Click "Add a variable"
   - Add each variable above
   - Use the NETLIFY_DATABASE_URL from your database settings
   - Generate a strong JWT_SECRET (use: `openssl rand -base64 32`)

3. **Redeploy**:
   - Trigger a new deployment after adding variables
   - Visit: https://chatverse12.netlify.app/api/init-db
   - This will create the database tables

## Database Initialization

After setting up environment variables:
1. Visit: https://chatverse12.netlify.app/api/init-db
2. You should see a success message with table names
3. Your database will be ready for use

## Testing Your Setup

1. **Visit your site**: https://chatverse12.netlify.app/
2. **Register a new account**
3. **Create a room and send messages**
4. **Test real-time functionality**

Your ChatVerse application should now be fully functional! 🚀
