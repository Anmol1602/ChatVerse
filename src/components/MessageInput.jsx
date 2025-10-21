import { useState, useRef, useEffect } from 'react'
import { Send, Smile } from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'
import { useChatStore } from '../stores/chatStore'
import { wsManager } from '../utils/websocket'

const MessageInput = ({ roomId }) => {
  const [message, setMessage] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const inputRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const { sendMessage } = useChatStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim() || !roomId) return

    const content = message.trim()
    setMessage('')
    setShowEmojiPicker(false)
    
    // Stop typing indicator
    if (isTyping) {
      wsManager.sendStopTyping(roomId)
      setIsTyping(false)
    }

    await sendMessage(content)
  }

  const handleInputChange = (e) => {
    setMessage(e.target.value)
    
    // Send typing indicator
    if (!isTyping && roomId) {
      wsManager.sendTyping(roomId)
      setIsTyping(true)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping && roomId) {
        wsManager.sendStopTyping(roomId)
        setIsTyping(false)
      }
    }, 2000)
  }

  const handleEmojiClick = (emojiData) => {
    setMessage(prev => prev + emojiData.emoji)
    inputRef.current?.focus()
  }

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (isTyping && roomId) {
        wsManager.sendStopTyping(roomId)
      }
    }
  }, [isTyping, roomId])

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex items-end gap-2 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <Smile className="w-5 h-5" />
        </button>
        
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
            rows="1"
            style={{ minHeight: '40px', maxHeight: '120px' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
          />
        </div>
        
        <button
          type="submit"
          disabled={!message.trim()}
          className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {showEmojiPicker && (
        <div className="absolute bottom-full left-0 mb-2 z-10">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            width={300}
            height={400}
            searchDisabled={false}
            skinTonesDisabled={false}
            previewConfig={{
              showPreview: false
            }}
          />
        </div>
      )}
    </div>
  )
}

export default MessageInput
