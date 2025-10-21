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

  // Room management
  fetchRooms: async () => {
    set({ loading: true })
    try {
      const response = await api.get('/rooms')
      set({ rooms: response.data.rooms, loading: false })
    } catch (error) {
      set({ loading: false })
      toast.error('Failed to load rooms')
    }
  },

  createRoom: async (name, description, type = 'group', memberIds = []) => {
    set({ loading: true })
    try {
      const response = await api.post('/rooms', {
        name,
        description,
        type,
        memberIds
      })
      
      const newRoom = response.data.room
      set(state => ({
        rooms: [newRoom, ...state.rooms],
        loading: false
      }))
      
      toast.success('Room created successfully!')
      return { success: true, room: newRoom }
    } catch (error) {
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
    set({ currentRoom: room })
    if (room) {
      get().fetchMessages(room.id)
    }
  },

  // Message management
  fetchMessages: async (roomId) => {
    try {
      const response = await api.get(`/messages?roomId=${roomId}`)
      set({ messages: response.data.messages })
    } catch (error) {
      toast.error('Failed to load messages')
    }
  },

  sendMessage: async (content, type = 'text') => {
    const { currentRoom } = get()
    if (!currentRoom) return { success: false, error: 'No room selected' }

    try {
      const response = await api.post('/messages', {
        roomId: currentRoom.id,
        content,
        type
      })
      
      const newMessage = response.data.message
      set(state => ({
        messages: [...state.messages, newMessage]
      }))
      
      return { success: true, message: newMessage }
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to send message'
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

  // User management
  searchUsers: async (query) => {
    try {
      const response = await api.post('/users', { query })
      set({ users: response.data.users })
    } catch (error) {
      toast.error('Failed to search users')
    }
  },

  // Real-time updates
  addMessage: (message) => {
    set(state => {
      const exists = state.messages.some(m => m.id === message.id)
      if (exists) return state
      
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
  }
}))
