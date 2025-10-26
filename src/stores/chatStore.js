import { create } from 'zustand'
import { api } from '../utils/api'
import toast from 'react-hot-toast'

export const useChatStore = create((set, get) => ({
  rooms: [],
  currentRoom: null,
  messages: [],
  users: [],
  loading: false,
  typingUsers: new Set(),
  onlineUsers: new Set(),
  isFetchingRooms: false, // Add flag to prevent multiple calls
  messagePollingInterval: null, // For real-time message polling
  isPollingMessages: false, // Prevent multiple polling calls
  roomsPollingInterval: null, // For refreshing rooms list
  lastRoomsFetch: null, // Track last rooms fetch to prevent rapid successive calls

  // Room management
  fetchRooms: async () => {
    const { isFetchingRooms, rooms } = get()
    
    // Prevent multiple simultaneous calls
    if (isFetchingRooms) {
      console.log('fetchRooms already in progress, skipping...')
      return
    }
    
    console.log('Fetching rooms...')
    set({ loading: true, isFetchingRooms: true })
    try {
      const response = await api.get('/rooms')
      console.log('Rooms API response:', response.data)
      const newRooms = response.data.rooms || []
      console.log(`Found ${newRooms.length} rooms:`, newRooms.map(r => ({ id: r.id, name: r.name, type: r.type })))
      
      // Check if there are new rooms (without toast notifications to prevent issues)
      const currentRoomIds = new Set(rooms.map(r => r.id))
      const newRoomIds = new Set(newRooms.map(r => r.id))
      const hasNewRooms = newRooms.length > rooms.length || 
                         [...newRoomIds].some(id => !currentRoomIds.has(id))
      
      if (hasNewRooms) {
        console.log('New rooms detected!')
        // Removed toast notification to prevent page reload issues
      }
      
      // Sort rooms by last_message_at (most recent first)
      const sortedRooms = newRooms.sort((a, b) => {
        const aTime = new Date(a.last_message_at || a.updated_at || a.created_at).getTime()
        const bTime = new Date(b.last_message_at || b.updated_at || b.created_at).getTime()
        return bTime - aTime // Most recent first
      })
      
      set({ 
        rooms: sortedRooms, 
        loading: false, 
        isFetchingRooms: false 
      })
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
      // Don't clear rooms on error to maintain current state and prevent page reloads
      console.log('Keeping existing rooms due to fetch error')
      set({ loading: false, isFetchingRooms: false })
      // Remove toast error to prevent page reload issues
      // toast.error('Failed to load rooms')
    }
  },

  createRoom: async (name, description, type = 'group', memberIds = []) => {
    set({ loading: true })
    try {
      console.log('Creating room with:', { name, description, type, memberIds })
      
      const response = await api.post('/rooms', {
        name,
        description,
        type,
        memberIds
      })

      console.log('Room creation response:', response.data)
      const newRoom = response.data.room
      
      // Refresh the entire rooms list to ensure all members see the room
      console.log('Refreshing rooms list...')
      await get().fetchRooms()
      
      set({ loading: false })
      toast.success(`Room "${name}" created successfully!`)
      return { success: true, room: newRoom }
    } catch (error) {
      console.error('Room creation error:', error)
      set({ loading: false })
      const message = error.response?.data?.error || 'Failed to create room'
      toast.error(message)
      return { success: false, error: message }
    }
  },

  joinRoom: async (roomId) => {
    set({ loading: true })
    try {
      await api.put('/rooms', { roomId })
      await get().fetchRooms()
      set({ loading: false })
      toast.success('Joined room successfully!')
      return { success: true }
    } catch (error) {
      set({ loading: false })
      const message = error.response?.data?.error || 'Failed to join room'
      toast.error(message)
      return { success: false, error: message }
    }
  },

  leaveRoom: async (roomId) => {
    set({ loading: true })
    try {
      await api.delete('/rooms', { data: { roomId } })
      set(state => ({
        rooms: state.rooms.filter(room => room.id !== roomId),
        currentRoom: state.currentRoom?.id === roomId ? null : state.currentRoom,
        loading: false
      }))
      toast.success('Left room successfully!')
      return { success: true }
    } catch (error) {
      set({ loading: false })
      const message = error.response?.data?.error || 'Failed to leave room'
      toast.error(message)
      return { success: false, error: message }
    }
  },

  setCurrentRoom: (room) => {
    const { messagePollingInterval } = get()
    
    // Clear existing polling
    if (messagePollingInterval) {
      clearInterval(messagePollingInterval)
    }
    
    console.log('Setting current room:', room?.id, room?.name)
    set({ currentRoom: room, messages: [] }) // Clear messages when switching rooms
    if (room) {
      console.log('Fetching messages for room:', room.id)
      get().fetchMessages(room.id)
      // Re-enable polling for real-time message updates
      const interval = setInterval(() => {
        get().pollForNewMessages(room.id)
      }, 15000) // Increased to 15 seconds to prevent page reloads
      set({ messagePollingInterval: interval })
      console.log('Room switching completed for:', room.name)
    }
  },

  pollForNewMessages: async (roomId) => {
    const { isPollingMessages, messages, currentRoom } = get()
    
    // Only poll if we're in the correct room
    if (currentRoom?.id !== roomId) {
      return
    }
    
    // Prevent multiple polling calls
    if (isPollingMessages) {
      return
    }
    
    set({ isPollingMessages: true })
    
    try {
      const response = await api.get(`/messages?roomId=${roomId}`)
      
      // Get existing message IDs to avoid duplicates
      const existingMessageIds = new Set(messages.map(m => m.id))
      
      // Only get messages we don't already have
      const newMessages = response.data.messages.filter(msg => !existingMessageIds.has(msg.id))
      
      if (newMessages.length > 0) {
        console.log(`Polling: Found ${newMessages.length} new messages for room ${roomId}`)
        
        // Add new messages to the current room
        set(state => ({
          messages: [...state.messages, ...newMessages]
        }))
        
        // Update unread counts locally instead of full room refresh
        console.log('Updating unread counts locally for new messages...')
        set(state => ({
          rooms: state.rooms.map(room => 
            room.id === roomId 
              ? { ...room, unread_count: (room.unread_count || 0) + newMessages.length }
              : room
          )
        }))
      }
    } catch (error) {
      // Silently fail for polling - don't show errors
      console.warn('Failed to poll for messages:', error)
    } finally {
      set({ isPollingMessages: false })
    }
  },

  // Message management
  fetchMessages: async (roomId) => {
    try {
      console.log('Fetching messages for room:', roomId)
      const response = await api.get(`/messages?roomId=${roomId}`)
      const newMessages = response.data.messages || []
      console.log(`Fetched ${newMessages.length} messages for room ${roomId}`)
      
      // Remove duplicates by ID
      const uniqueMessages = newMessages.filter((message, index, self) => 
        index === self.findIndex(m => m.id === message.id)
      )
      
      console.log(`After deduplication: ${uniqueMessages.length} unique messages`)
      set({ messages: uniqueMessages })
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      toast.error('Failed to load messages')
    }
  },

  sendMessage: async (content, type = 'text') => {
    const { currentRoom } = get()
    if (!currentRoom) return { success: false, error: 'No room selected' }

    try {
      // First, store the message in the database
      const response = await api.post('/messages', {
        roomId: currentRoom.id,
        content,
        type
      })
      
      const newMessage = response.data.message
      
      // Add message to local state immediately (only if not already present)
      set(state => {
        const exists = state.messages.some(m => m.id === newMessage.id)
        if (exists) {
          console.log('Message already exists in local state, skipping:', newMessage.id)
          return state
        }
        
        console.log('Adding sent message to local state:', newMessage.id, newMessage.content)
        // Use a more robust deduplication approach
        const existingIds = new Set(state.messages.map(m => m.id))
        if (existingIds.has(newMessage.id)) {
          console.log('Message ID already exists, skipping:', newMessage.id)
          return state
        }
        
        return {
          messages: [...state.messages, newMessage]
        }
      })
      
      // Temporarily disable broadcasting to prevent duplicates
      // try {
      //   await api.post('/broadcast-message', {
      //     roomId: currentRoom.id,
      //     message: newMessage,
      //     userId: newMessage.user_id
      //   })
      // } catch (broadcastError) {
      //   console.warn('Failed to broadcast message:', broadcastError)
      //   // Don't fail the send operation if broadcast fails
      // }
      
      // Update unread counts locally for other users instead of full room refresh
      console.log('Updating unread counts locally after sending message...')
      // No need to refresh rooms - message polling will handle updates for other users
      
      return { success: true, message: newMessage }
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to send message'
      toast.error(message)
      return { success: false, error: message }
    }
  },

  // Send file
  sendFile: async (file) => {
    const { currentRoom } = get()
    if (!currentRoom || !file) return { success: false, error: 'No room selected or file provided' }

    try {
      // Convert file to base64
      const fileData = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result.split(',')[1]) // Remove data:type;base64, prefix
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const response = await api.post('/upload-file', {
        fileData,
        fileName: file.name,
        fileType: file.type,
        roomId: currentRoom.id
      })

      if (response.data.message) {
        // Add the file message to local state
        set(state => {
          const exists = state.messages.some(m => m.id === response.data.message.id)
          if (exists) {
            console.log('File message already exists in local state, skipping:', response.data.message.id)
            return state
          }
          
          return {
            messages: [...state.messages, response.data.message]
          }
        })

        // Refresh rooms to update last message
        setTimeout(() => {
          get().fetchRooms()
        }, 1000)

        return { success: true, message: response.data.message }
      }
    } catch (error) {
      console.error('Failed to send file:', error)
      const message = error.response?.data?.error || 'Failed to send file'
      toast.error(message)
      return { success: false, error: message }
    }
  },

  markMessagesAsRead: async (messageIds) => {
    try {
      await api.put('/messages', { messageIds })
    } catch (error) {
      console.error('Failed to mark messages as read:', error)
    }
  },

  // Message reactions
  addReaction: async (messageId, emoji) => {
    try {
      const response = await api.post('/reactions', {
        messageId,
        emoji
      })

      if (response.data.reaction) {
        // Update message in local state
        set(state => ({
          messages: state.messages.map(msg => 
            msg.id === messageId 
              ? {
                  ...msg,
                  reactions: [...(msg.reactions || []), response.data.reaction]
                }
              : msg
          )
        }))
        return { success: true, reaction: response.data.reaction }
      }
    } catch (error) {
      console.error('Failed to add reaction:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to add reaction' }
    }
  },

  removeReaction: async (messageId, emoji) => {
    try {
      await api.delete('/reactions', {
        messageId,
        emoji
      })

      // Update message in local state
      set(state => ({
        messages: state.messages.map(msg => 
          msg.id === messageId 
            ? {
                ...msg,
                reactions: (msg.reactions || []).filter(r => 
                  !(r.emoji === emoji && r.user_id === get().user?.id)
                )
              }
            : msg
        )
      }))

      return { success: true }
    } catch (error) {
      console.error('Failed to remove reaction:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to remove reaction' }
    }
  },

  // User management
  searchUsers: async (query) => {
    try {
      console.log('Searching users with query:', query)
      const response = await api.post('/users', { query })
      console.log('Users search response:', response.data)
      const users = response.data.users || []
      console.log(`Found ${users.length} users:`, users.map(u => ({ id: u.id, name: u.name, email: u.email })))
      set({ users })
      console.log('Users set in store:', users.length)
    } catch (error) {
      console.error('Failed to search users:', error)
      toast.error('Failed to search users')
      set({ users: [] }) // Clear users on error
    }
  },

  // Clear users (for cleanup)
  clearUsers: () => {
    console.log('Clearing users from store')
    set({ users: [] })
  },

  // Presence management
  updatePresence: async (status) => {
    try {
      await api.post('/presence', { status })
      console.log('Presence updated:', status)
    } catch (error) {
      console.error('Failed to update presence:', error)
    }
  },

  sendHeartbeat: async () => {
    try {
      await api.put('/presence')
    } catch (error) {
      console.error('Failed to send heartbeat:', error)
    }
  },

  fetchOnlineUsers: async (roomId = null) => {
    try {
      const url = roomId ? `/presence?roomId=${roomId}` : '/presence'
      const response = await api.get(url)
      return response.data.users || []
    } catch (error) {
      console.error('Failed to fetch online users:', error)
      return []
    }
  },

  // Remove member from room
  removeMember: async (roomId, memberId) => {
    try {
      const response = await api.delete('/room-members', {
        roomId,
        userId: memberId
      })
      
      if (response.data.message) {
        console.log('Member removed successfully')
        // Refresh rooms to update member count
        get().fetchRooms()
        return { success: true }
      }
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to remove member'
      console.error('Remove member error:', message)
      return { success: false, error: message }
    }
  },

  // Delete message
  deleteMessage: async (messageId) => {
    try {
      const response = await api.delete('/messages', {
        messageId
      })
      
      if (response.data.message) {
        console.log('Message deleted successfully')
        // Remove message from local state
        set(state => ({
          messages: state.messages.filter(m => m.id !== messageId)
        }))
        return { success: true }
      }
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to delete message'
      console.error('Delete message error:', message)
      return { success: false, error: message }
    }
  },



  // Delete room functionality
  deleteRoom: async (roomId) => {
    try {
      console.log('Deleting room:', roomId)
      const response = await api.delete('/delete-room', { data: { roomId } })
      console.log('Room deletion response:', response.data)
      
      // Remove room from local state
      set(state => ({
        rooms: state.rooms.filter(room => room.id !== roomId),
        currentRoom: state.currentRoom?.id === roomId ? null : state.currentRoom
      }))
      
      toast.success('Room deleted successfully!')
      return { success: true }
    } catch (error) {
      console.error('Failed to delete room:', error)
      const message = error.response?.data?.error || 'Failed to delete room'
      toast.error(message)
      return { success: false, error: message }
    }
  },

  // Mark room as read
  markRoomAsRead: async (roomId) => {
    try {
      console.log('Marking room as read:', roomId)
      await api.post('/mark-read', { roomId })
      
      // Update local state to clear unread count
      set(state => ({
        rooms: state.rooms.map(room => 
          room.id === roomId 
            ? { ...room, unread_count: 0 }
            : room
        )
      }))
      
      console.log('Room marked as read:', roomId)
      return { success: true }
    } catch (error) {
      console.error('Failed to mark room as read:', error)
      return { success: false, error: error.message }
    }
  },

  // Real-time updates
  addMessage: (message) => {
    set(state => {
      const exists = state.messages.some(m => m.id === message.id)
      if (exists) {
        console.log('Message already exists, skipping:', message.id)
        return state
      }
      
      console.log('Adding new message:', message.id, message.content)
      return {
        messages: [...state.messages, message]
      }
    })
  },

  updateUserOnlineStatus: (userId, online) => {
    set(state => {
      const newOnlineUsers = new Set(state.onlineUsers)
      if (online) {
        newOnlineUsers.add(userId)
      } else {
        newOnlineUsers.delete(userId)
      }
      return { onlineUsers: newOnlineUsers }
    })
  },

  addTypingUser: (userId) => {
    set(state => ({
      typingUsers: new Set([...state.typingUsers, userId])
    }))
  },

  removeTypingUser: (userId) => {
    set(state => {
      const newTypingUsers = new Set(state.typingUsers)
      newTypingUsers.delete(userId)
      return { typingUsers: newTypingUsers }
    })
  },

  clearTypingUsers: () => {
    set({ typingUsers: new Set() })
  },

  // Cleanup polling when leaving chat
  stopMessagePolling: () => {
    const { messagePollingInterval } = get()
    if (messagePollingInterval) {
      clearInterval(messagePollingInterval)
      set({ messagePollingInterval: null })
    }
  },

  // Start rooms polling to keep rooms list synchronized
  startRoomsPolling: () => {
    const { roomsPollingInterval } = get()
    
    // Clear existing polling
    if (roomsPollingInterval) {
      clearInterval(roomsPollingInterval)
    }
    
    console.log('Starting rooms polling for real-time updates')
    // Start polling for rooms every 45 seconds to prevent page reload issues
    const interval = setInterval(() => {
      console.log('Polling for rooms updates...')
      // Add debouncing to prevent rapid successive calls
      const { lastRoomsFetch } = get()
      const now = Date.now()
      if (!lastRoomsFetch || (now - lastRoomsFetch) > 40000) { // 40 second minimum between fetches
        get().fetchRooms()
        set({ lastRoomsFetch: now })
      } else {
        console.log('Skipping rooms fetch - too soon since last fetch')
      }
    }, 45000) // 45 seconds to prevent page reload issues
    
    set({ roomsPollingInterval: interval })
  },

  // Stop rooms polling
  stopRoomsPolling: () => {
    const { roomsPollingInterval } = get()
    if (roomsPollingInterval) {
      clearInterval(roomsPollingInterval)
      set({ roomsPollingInterval: null })
    }
  },

  // Direct messaging functionality
  createDM: async (targetUserId) => {
    try {
      const response = await api.post('/create-dm', { targetUserId })
      const { room, isNew } = response.data
      
      console.log('DM creation response:', { room, isNew })
      
      if (isNew) {
        // Add the new DM room to the rooms list
        set(state => ({
          rooms: [room, ...state.rooms]
        }))
        toast.success('Direct message started!')
      } else {
        // For existing DMs, refresh the rooms list to ensure it's visible
        console.log('Existing DM found, refreshing rooms list')
        await get().fetchRooms()
        toast.success('Direct message opened!')
      }
      
      // Removed immediate refresh to prevent page reload issues
      // Other users will see the DM when they manually refresh or reload the page
      
      // Switch to the DM room after creation/opening
      console.log('Switching to DM room:', room.id)
      get().setCurrentRoom(room)
      
      return { success: true, room, isNew }
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to create DM'
      toast.error(message)
      return { success: false, error: message }
    }
  },

  // Manual refresh for messages (since polling is disabled)
  refreshMessages: async (roomId) => {
    try {
      const response = await api.get(`/messages?roomId=${roomId}`)
      set({ messages: response.data.messages })
    } catch (error) {
      console.warn('Failed to refresh messages:', error)
    }
  },

  // Room member management
  fetchRoomMembers: async (roomId) => {
    try {
      console.log('Fetching room members for roomId:', roomId)
      const response = await api.get(`/room-members?roomId=${roomId}`)
      console.log('Room members response:', response.data)
      return { success: true, members: response.data.members }
    } catch (error) {
      console.error('Fetch room members error:', error)
      const message = error.response?.data?.error || 'Failed to fetch room members'
      toast.error(message)
      return { success: false, error: message }
    }
  },

  addMemberToRoom: async (roomId, userId) => {
    try {
      const response = await api.post('/room-members', { roomId, userId })
      
      // Refresh rooms list to show the room to the newly added member
      await get().fetchRooms()
      
      toast.success('User added to room successfully!')
      return { success: true, user: response.data.user }
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to add user to room'
      toast.error(message)
      return { success: false, error: message }
    }
  },

  removeMemberFromRoom: async (roomId, userId) => {
    try {
      await api.delete('/room-members', { data: { roomId, userId } })
      toast.success('User removed from room successfully!')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to remove user from room'
      toast.error(message)
      return { success: false, error: message }
    }
  },

  // Search messages
  searchMessages: async (roomId, query) => {
    try {
      const response = await api.get('/messages/search', {
        params: { roomId, q: query }
      })
      
      if (response.data.messages) {
        return response.data.messages
      }
      return []
    } catch (error) {
      console.error('Search messages error:', error)
      return []
    }
  },

  // Forward message
  forwardMessage: async (messageId, targetRoomId) => {
    try {
      const response = await api.post('/messages/forward', {
        messageId,
        targetRoomId
      })
      
      if (response.data.success) {
        console.log('Message forwarded successfully')
        return { success: true }
      }
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to forward message'
      console.error('Forward message error:', message)
      return { success: false, error: message }
    }
  }
}))
