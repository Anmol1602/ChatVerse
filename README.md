# 💬 ChatVerse - Real-time Chat Application

A modern, full-stack real-time chat application built with React, Tailwind CSS, and Netlify Functions + Netlify Database. Features real-time messaging, user authentication, and a beautiful responsive UI.

## 🚀 Features

### 🔐 Authentication
- **Secure Registration & Login** with JWT tokens
- **Password hashing** with bcrypt
- **HttpOnly cookies** for secure token storage
- **User profiles** with avatars and online status

### 💬 Chat Features
- **Real-time messaging** with WebSocket support
- **One-to-one and group chats**
- **Typing indicators** and read receipts
- **Message timestamps** and persistent storage
- **User online/offline status**
- **Room creation and management**

### 🎨 UI/UX
- **Fully responsive** design with Tailwind CSS
- **Dark/Light theme** toggle
- **Smooth animations** with Framer Motion
- **Emoji picker** integration
- **Modern chat interface** with sidebar and main chat area
- **Mobile-friendly** responsive layout

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite for fast development
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Zustand** for state management
- **React Router** for navigation
- **Socket.io-client** for real-time communication
- **Axios** for API calls

### Backend (Serverless)
- **Netlify Functions** (Node.js runtime)
- **Netlify Database** (PostgreSQL)
- **JWT** for authentication
- **bcryptjs** for password hashing
- **CORS** enabled for cross-origin requests

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Netlify account

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ChatVerse
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory:

```env
# JWT Secret for token signing
JWT_SECRET=your_super_secret_jwt_key_here

# Netlify Database Connection
NETLIFY_DB_CONNECTION=your_netlify_database_connection_string

# Frontend Environment Variables
VITE_API_URL=https://your-site.netlify.app/api
VITE_WS_URL=wss://your-site.netlify.app
```

### 4. Database Setup
1. Create a Netlify Database in your Netlify dashboard
2. Copy the connection string to your environment variables
3. Deploy the functions to initialize the database schema

### 5. Development
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🚀 Deployment

### Deploy to Netlify

1. **Connect to GitHub**
   - Push your code to a GitHub repository
   - Connect the repository to Netlify

2. **Configure Environment Variables**
   - In Netlify dashboard, go to Site settings > Environment variables
   - Add the environment variables from your `.env` file

3. **Deploy**
   - Netlify will automatically build and deploy your site
   - Your functions will be available at `/.netlify/functions/`

### Database Initialization
After deployment, visit `https://your-site.netlify.app/api/init-db` to initialize the database schema.

## 📁 Project Structure

```
ChatVerse/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── ChatArea.jsx
│   │   ├── MessageBubble.jsx
│   │   ├── MessageInput.jsx
│   │   ├── Sidebar.jsx
│   │   └── ...
│   ├── pages/               # Main application pages
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── Chat.jsx
│   ├── stores/              # Zustand state management
│   │   ├── authStore.js
│   │   └── chatStore.js
│   ├── utils/               # Utility functions
│   │   ├── api.js
│   │   ├── formatTime.js
│   │   └── websocket.js
│   └── App.jsx
├── netlify/
│   └── functions/           # Netlify serverless functions
│       ├── auth.js
│       ├── messages.js
│       ├── rooms.js
│       ├── users.js
│       └── init-db.js
├── netlify.toml            # Netlify configuration
└── package.json
```

## 🔧 API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth` - Register, login, or logout
  - Body: `{ action: 'register'|'login'|'logout', ... }`

### Messages (`/api/messages`)
- `GET /api/messages?roomId={id}` - Get messages for a room
- `POST /api/messages` - Send a new message
- `PUT /api/messages` - Mark messages as read

### Rooms (`/api/rooms`)
- `GET /api/rooms` - Get user's rooms
- `POST /api/rooms` - Create a new room
- `PUT /api/rooms` - Join a room
- `DELETE /api/rooms` - Leave a room

### Users (`/api/users`)
- `GET /api/users` - Get current user profile
- `PUT /api/users` - Update user profile
- `POST /api/users` - Search users

## 🎯 Key Features Implementation

### Real-time Communication
- WebSocket connection for live updates
- Typing indicators
- Online/offline status
- Message delivery notifications

### Security
- JWT token authentication
- Password hashing with bcrypt
- HttpOnly cookies
- CORS configuration
- Input validation

### User Experience
- Responsive design
- Dark/light theme
- Smooth animations
- Emoji support
- Message timestamps
- Read receipts

## 🧪 Testing

```bash
# Run linting
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Include steps to reproduce any bugs

## 🎉 Acknowledgments

- Built with ❤️ using React and Netlify
- Icons by [Lucide](https://lucide.dev/)
- Animations by [Framer Motion](https://www.framer.com/motion/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)

---

**Happy Chatting! 💬**
