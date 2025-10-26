import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore } from '../stores/chatStore'
import { 
  Plus, 
  Search, 
  MessageCircle, 
  Users,
  Settings,
  X,
  Hash,
  RefreshCw
} from 'lucide-react'
import CreateRoomModal from './CreateRoomModal'
import UserSearchModal from './UserSearchModal'
import EnhancedLoadingSpinner from './EnhancedLoadingSpinner'

const Sidebar = ({ onClose }) => {
  const { 
    rooms, 
    currentRoom, 
    setCurrentRoom, 
    fetchRooms, 
    loading,
    createDM,
    markRoomAsRead
  } = useChatStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [showUserSearch, setShowUserSearch] = useState(false)

  // fetchRooms is already called by the Chat component
  // No need to call it again here

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Rooms
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                console.log('Manual rooms refresh triggered')
                fetchRooms()
              }}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Refresh rooms"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowUserSearch(true)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Start direct message"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowCreateRoom(true)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Create room"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Rooms list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <EnhancedLoadingSpinner size="md" />
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery ? 'No rooms found' : 'No rooms yet'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowCreateRoom(true)}
                className="mt-4 text-primary-600 hover:text-primary-500 text-sm font-medium"
              >
                Create your first room
              </button>
            )}
          </div>
        ) : (
          <div className="p-2">
            <AnimatePresence>
              {filteredRooms.map((room, index) => (
                <motion.button
                  key={room.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: index * 0.05,
                    ease: 'easeOut'
                  }}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    setCurrentRoom(room)
                    // Mark room as read when selected
                    if (room.unread_count > 0) {
                      await markRoomAsRead(room.id)
                    }
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors duration-200 ${
                    currentRoom?.id === room.id
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                <div className="flex-shrink-0">
                  {room.type === 'group' ? (
                    <Users className="w-5 h-5" />
                  ) : (
                    <MessageCircle className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{room.name}</p>
                    {room.type === 'group' && (
                      <Hash className="w-3 h-3 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {room.member_count} member{room.member_count !== 1 ? 's' : ''}
                    </p>
                    {room.unread_count > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                        {room.unread_count > 99 ? '99+' : room.unread_count}
                      </span>
                    )}
                  </div>
                </div>
                {room.last_message_at && (
                  <div className="flex-shrink-0 text-xs text-gray-400">
                    {new Date(room.last_message_at).toLocaleDateString()}
                  </div>
                )}
              </motion.button>
            ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUserSearch(true)}
            className="flex-1 flex items-center gap-2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Search className="w-4 h-4" />
            <span className="text-sm">Find users</span>
          </button>
          <button
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modals */}
      {showCreateRoom && (
        <CreateRoomModal onClose={() => setShowCreateRoom(false)} />
      )}
      
      {showUserSearch && (
        <UserSearchModal onClose={() => setShowUserSearch(false)} />
      )}
    </div>
  )
}

export default Sidebar
