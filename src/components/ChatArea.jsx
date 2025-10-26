import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore } from '../stores/chatStore'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import TypingIndicator from './TypingIndicator'
import MessageSearch from './MessageSearch'
import EnhancedLoadingSpinner from './EnhancedLoadingSpinner'
import { MessageCircle, Users, RefreshCw, Settings, Trash2, Search } from 'lucide-react'
import RoomMembersModal from './RoomMembersModal'
import DeleteRoomModal from './DeleteRoomModal'

const ChatArea = () => {
  const {
    currentRoom,
    messages,
    fetchMessages,
    sendMessage,
    typingUsers,
    refreshMessages,
    markRoomAsRead,
    refreshReactionsOnDemand
  } = useChatStore()
  
  const [isLoading, setIsLoading] = useState(false)
  const [showRoomMembers, setShowRoomMembers] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showMessageSearch, setShowMessageSearch] = useState(false)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)

  useEffect(() => {
    if (currentRoom) {
      setIsLoading(true)
      fetchMessages(currentRoom.id).finally(() => setIsLoading(false))
      
      // Mark room as read when messages are loaded
      if (currentRoom.unread_count > 0) {
        markRoomAsRead(currentRoom.id)
      }
    }
  }, [currentRoom?.id]) // Only depend on room ID, not the function

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
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 h-full">
      {/* Room header - Fixed at top */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMessageSearch(true)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Search messages"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowRoomMembers(true)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Manage room members"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={() => refreshMessages(currentRoom.id)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Refresh messages"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={() => refreshReactionsOnDemand(currentRoom.id)}
              className="p-2 text-yellow-500 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-200 transition-colors"
              title="Refresh reactions"
            >
              😃
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200 transition-colors"
              title="Delete room"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages area - Scrollable and grows to fill space */}
      <div className="flex-1 flex flex-col min-h-0">
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4"
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <EnhancedLoadingSpinner size="lg" />
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
            <AnimatePresence mode="popLayout">
              {messages.map((message, index) => {
                const isOwn = message.user_id === useChatStore.getState().user?.id
                const prevMessage = messages[index - 1]
                const showAvatar = !prevMessage || prevMessage.user_id !== message.user_id
                const showTime = !prevMessage || 
                  new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() > 300000 // 5 minutes

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ 
                      duration: 0.3, 
                      delay: index * 0.02,
                      ease: 'easeOut'
                    }}
                    layout
                  >
                    <MessageBubble
                      message={message}
                      isOwn={isOwn}
                      showAvatar={showAvatar}
                      showTime={showTime}
                    />
                  </motion.div>
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


      {/* Modals */}
      <RoomMembersModal
        isOpen={showRoomMembers}
        onClose={() => setShowRoomMembers(false)}
        roomId={currentRoom.id}
      />
      <DeleteRoomModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        room={currentRoom}
      />
      <MessageSearch
        isOpen={showMessageSearch}
        onClose={() => setShowMessageSearch(false)}
        roomId={currentRoom.id}
      />
        
    </div>
  )
}

export default ChatArea
