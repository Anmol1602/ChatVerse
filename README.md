# 🚀 ChatVerse - State-of-the-Art Real-Time Chat Application

A modern, full-stack real-time chat application built with React, TailwindCSS, and Netlify Functions. ChatVerse supports direct messages, group chats, file sharing, message reactions, and much more!

## ✨ Features

### 🔐 Authentication
- **Secure Login/Register** with JWT tokens
- **Password hashing** with bcrypt
- **Session management** with automatic token refresh
- **User profiles** with avatars and status

### 💬 Messaging System
- **Real-time messaging** with instant delivery
- **Direct Messages (DMs)** - One-to-one private conversations
- **Group Chats** - Create and manage group conversations
- **Message history** - All messages saved and searchable
- **Message types** - Text, files, images, and more

### 🎨 Advanced Features
- **File & Image Sharing** - Upload and share files up to 10MB
- **Message Reactions** - React to messages with emojis (👍❤️😂😢😡😮)
- **Read Receipts** - See when messages are delivered and read
- **Typing Indicators** - Real-time typing status
- **Online Presence** - See who's online and when they were last active
- **Emoji Picker** - Rich emoji selection for messages

### 🎭 User Experience
- **Dark/Light Mode** - Toggle between themes
- **Responsive Design** - Works perfectly on desktop and mobile
- **Smooth Animations** - Powered by Framer Motion
- **Modern UI** - Clean, intuitive interface with TailwindCSS
- **Real-time Updates** - Instant message delivery and status updates

### 🛠️ Technical Features
- **Serverless Architecture** - Built on Netlify Functions
- **PostgreSQL Database** - Reliable data persistence with Neon
- **Real-time Polling** - Efficient message synchronization
- **State Management** - Zustand for clean state handling
- **Type Safety** - Modern JavaScript with best practices

## 🏗️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **Zustand** - Lightweight state management
- **Axios** - HTTP client for API calls
- **React Router** - Client-side routing
- **Lucide React** - Beautiful icons

### Backend
- **Netlify Functions** - Serverless API endpoints
- **Neon Database** - PostgreSQL database
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Netlify account
- Neon database account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ChatVerse.git
   cd ChatVerse
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_API_URL=https://your-netlify-app.netlify.app/api
   VITE_WS_URL=wss://your-websocket-service.com
   NETLIFY_DATABASE_URL=your-neon-database-url
   JWT_SECRET=your-jwt-secret-key
   ```

4. **Run database migrations**
   ```bash
   # Visit these URLs in your browser to run migrations:
   # https://your-app.netlify.app/api/migrate-db
   # https://your-app.netlify.app/api/migrate-files
   # https://your-app.netlify.app/api/migrate-reactions
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Deploy to Netlify**
   ```bash
   npm run build
   # Deploy the dist folder to Netlify
   ```

## 📱 Usage

### Creating an Account
1. Visit the registration page
2. Enter your name, email, and password
3. Click "Create Account"
4. You'll be automatically logged in

### Starting a Chat
1. **Direct Message**: Click the "Start direct message" button in the sidebar
2. **Group Chat**: Click "Create room" and add members
3. **Join Existing**: Browse available rooms in the sidebar

### Sending Messages
- **Text**: Type in the message input and press Enter
- **Files**: Click the paperclip icon to upload files
- **Emojis**: Click the smile icon to add emojis
- **Reactions**: Click the smile icon on any message to react

### Managing Rooms
- **Add Members**: Click the room settings and add users
- **Remove Members**: Click on a member to remove them
- **Leave Room**: Click "Leave room" in room settings
- **Delete Room**: Only room creators can delete rooms

## 🔧 API Endpoints

### Authentication
- `POST /api/auth` - Login/Register
- `GET /api/users` - Get current user info

### Rooms
- `GET /api/rooms` - Get user's rooms
- `POST /api/rooms` - Create new room
- `PUT /api/rooms` - Join room
- `DELETE /api/rooms` - Leave room
- `DELETE /api/delete-room` - Delete room

### Messages
- `GET /api/messages` - Get room messages
- `POST /api/messages` - Send message
- `PUT /api/messages` - Mark messages as read
- `DELETE /api/messages` - Delete message

### Files
- `POST /api/upload-file` - Upload file
- `GET /api/files` - Get file info

### Reactions
- `GET /api/reactions` - Get message reactions
- `POST /api/reactions` - Add reaction
- `DELETE /api/reactions` - Remove reaction

### Presence
- `GET /api/presence` - Get online users
- `POST /api/presence` - Update online status
- `PUT /api/presence` - Send heartbeat

### Room Members
- `GET /api/room-members` - Get room members
- `POST /api/room-members` - Add member
- `DELETE /api/room-members` - Remove member

## 🎨 Customization

### Themes
The app supports both light and dark themes. The theme toggle is in the top navigation.

### Colors
Primary colors can be customized in `tailwind.config.js`:
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      }
    }
  }
}
```

### Animations
Animations are powered by Framer Motion. You can customize them in the component files.

## 🚀 Deployment

### Netlify Deployment
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard
5. Deploy!

### Environment Variables
Set these in your Netlify dashboard:
- `NETLIFY_DATABASE_URL` - Your Neon database URL
- `JWT_SECRET` - A secure random string for JWT signing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - UI library
- [TailwindCSS](https://tailwindcss.com/) - CSS framework
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [Netlify](https://netlify.com/) - Hosting and functions
- [Neon](https://neon.tech/) - Database hosting
- [Lucide](https://lucide.dev/) - Icons

## 📞 Support

If you have any questions or need help, please:
1. Check the [Issues](https://github.com/yourusername/ChatVerse/issues) page
2. Create a new issue with detailed information
3. Join our community discussions

---

**Built with ❤️ by [Your Name]**

*ChatVerse - Where conversations come to life! 🚀*