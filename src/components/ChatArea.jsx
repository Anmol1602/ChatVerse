import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore } from '../stores/chatStore'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import TypingIndicator from './TypingIndicator'
import { MessageCircle, Users } from 'lucide-react'

const ChatArea = () => {
  const { 
    currentRoom, 
    messages, 
    fetchMessages, 
    sendMessage,
    typingUsers 
  } = useChatStore()
  
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)

  useEffect(() => {
    if (currentRoom) {
      setIsLoading(true)
      fetchMessages(currentRoom.id).finally(() => setIsLoading(false))
    }
  }, [currentRoom, fetchMessages])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  if (!currentRoom) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Welcome to ChatVerse
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md">
            Select a room from the sidebar to start chatting, or create a new room to get started.
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
      {/* Room header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
            {currentRoom.type === 'group' ? (
              <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            ) : (
              <MessageCircle className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {currentRoom.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {currentRoom.member_count} member{currentRoom.member_count !== 1 ? 's' : ''}
              {currentRoom.description && ` • ${currentRoom.description}`}
            </p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 flex flex-col min-h-0">
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4"
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="spinner w-8 h-8" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No messages yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Start the conversation by sending a message below.
                </p>
              </div>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((message, index) => {
                const isOwn = message.user_id === useChatStore.getState().user?.id
                const prevMessage = messages[index - 1]
                const showAvatar = !prevMessage || prevMessage.user_id !== message.user_id
                const showTime = !prevMessage || 
                  new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() > 300000 // 5 minutes

                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={isOwn}
                    showAvatar={showAvatar}
                    showTime={showTime}
                  />
                )
              })}
            </AnimatePresence>
          )}
          
          {/* Typing indicator */}
          <TypingIndicator roomId={currentRoom.id} />
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        <MessageInput roomId={currentRoom.id} />
      </div>
    </div>
  )
}

export default ChatArea
