import { useChatStore } from '../stores/chatStore'
import { useAuthStore } from '../stores/authStore'

class WebSocketManager {
  constructor() {
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
    this.heartbeatInterval = null
  }

  connect() {
    const { token } = useAuthStore.getState()
    if (!token) return

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8888'
    
    try {
      this.ws = new WebSocket(`${wsUrl}?token=${token}`)
      
      this.ws.onopen = () => {
        console.log('WebSocket connected')
        this.reconnectAttempts = 0
        this.startHeartbeat()
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleMessage(data)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.ws.onclose = () => {
        console.log('WebSocket disconnected')
        this.stopHeartbeat()
        this.attemptReconnect()
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
      this.attemptReconnect()
    }
  }

  handleMessage(data) {
    const { type, payload } = data

    switch (type) {
      case 'new_message':
        useChatStore.getState().addMessage(payload.message)
        break
      
      case 'user_typing':
        useChatStore.getState().addTypingUser(payload.userId)
        break
      
      case 'user_stopped_typing':
        useChatStore.getState().removeTypingUser(payload.userId)
        break
      
      case 'user_online':
        useChatStore.getState().updateUserOnlineStatus(payload.userId, true)
        break
      
      case 'user_offline':
        useChatStore.getState().updateUserOnlineStatus(payload.userId, false)
        break
      
      case 'room_updated':
        useChatStore.getState().fetchRooms()
        break
      
      default:
        console.log('Unknown message type:', type)
    }
  }

  sendMessage(type, payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }))
    }
  }

  sendTyping(roomId) {
    this.sendMessage('typing', { roomId })
  }

  sendStopTyping(roomId) {
    this.sendMessage('stop_typing', { roomId })
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }))
      }
    }, 30000) // Send ping every 30 seconds
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`)
      
      setTimeout(() => {
        this.connect()
      }, delay)
    } else {
      console.error('Max reconnection attempts reached')
    }
  }

  disconnect() {
    this.stopHeartbeat()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

// Create singleton instance
export const wsManager = new WebSocketManager()

// Auto-connect when user is authenticated
useAuthStore.subscribe(
  (state) => state.user,
  (user) => {
    if (user) {
      wsManager.connect()
    } else {
      wsManager.disconnect()
    }
  }
)
