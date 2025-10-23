#!/bin/bash

# Clean up git history by creating logical commits
echo "Starting git history cleanup..."

# Reset to initial commit but keep all changes
git reset --soft 7efc689

# Create logical commits for major features

echo "Creating commit 1: Project setup and configuration"
git add netlify.toml package.json src/main.jsx
git commit -m "feat: Setup project configuration and routing

- Configure Netlify redirects for SPA routing  
- Add dependencies for authentication and database
- Setup React StrictMode and routing"

echo "Creating commit 2: Database and authentication setup"
git add netlify/functions/auth.js netlify/functions/init-db.js netlify/functions/package.json
git commit -m "feat: Setup database and authentication

- Configure Neon PostgreSQL database connection
- Implement JWT-based authentication
- Add database initialization and migration functions"

echo "Creating commit 3: Core chat functionality"
git add netlify/functions/messages.js netlify/functions/rooms.js netlify/functions/users.js
git add src/stores/chatStore.js src/pages/Chat.jsx src/components/ChatArea.jsx
git add src/components/MessageBubble.jsx src/components/MessageInput.jsx
git commit -m "feat: Implement core chat functionality

- Real-time messaging with polling
- Room creation and management
- User authentication and session management
- Message display and input components"

echo "Creating commit 4: Room management features"
git add netlify/functions/room-members.js netlify/functions/delete-room.js
git add src/components/RoomMembersModal.jsx src/components/DeleteRoomModal.jsx
git add src/components/CreateRoomModal.jsx src/components/Sidebar.jsx
git commit -m "feat: Add room management features

- Room member management
- Room deletion with confirmation
- Room creation with member selection
- Enhanced sidebar with room controls"

echo "Creating commit 5: Direct messaging and user search"
git add netlify/functions/create-dm.js src/components/UserSearchModal.jsx
git commit -m "feat: Add direct messaging functionality

- WhatsApp-style direct messaging
- User search and selection
- Automatic DM room creation
- User search with debouncing"

echo "Creating commit 6: Real-time updates and polling"
git add netlify/functions/broadcast-message.js netlify/functions/mark-read.js
git add netlify/functions/migrate-db.js
git commit -m "feat: Implement real-time updates

- Message polling for real-time updates
- Unread message counts and room sorting
- Message broadcasting system
- Database migration for new features"

echo "Creating commit 7: Utility functions and cleanup"
git add netlify/functions/cleanup-db.js netlify/functions/delete-user.js
git add netlify/functions/debug-rooms.js netlify-env-setup.md
git commit -m "feat: Add utility functions and documentation

- Database cleanup and maintenance functions
- User deletion functionality
- Debug utilities for troubleshooting
- Environment setup documentation"

echo "Git history cleanup completed!"
echo "New clean history created with logical commits"
