import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, X, MessageCircle, Users, Search } from 'lucide-react'
import { useChatStore } from '../stores/chatStore'

const MessageForward = ({ isOpen, onClose, message }) => {
  const [selectedRooms, setSelectedRooms] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(false)
  const { user, rooms: userRooms, forwardMessage } = useChatStore()

  useEffect(() => {
    if (isOpen) {
      // Filter out the current room and get available rooms
      const availableRooms = userRooms.filter(room => 
        room.id !== message?.room_id && 
        room.type === 'group' // Only allow forwarding to group chats
      )
      setRooms(availableRooms)
    }
  }, [isOpen, userRooms, message])

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleRoomToggle = (roomId) => {
    setSelectedRooms(prev => 
      prev.includes(roomId) 
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    )
  }

  const handleForward = async () => {
    if (selectedRooms.length === 0 || !message) return

    setLoading(true)
    try {
      for (const roomId of selectedRooms) {
        await forwardMessage(message.id, roomId)
      }
      onClose()
      setSelectedRooms([])
      setSearchQuery('')
    } catch (error) {
      console.error('Failed to forward message:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onClose()
    setSelectedRooms([])
    setSearchQuery('')
  }

  if (!isOpen || !message) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={handleClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Forward Message
          </h3>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Preview */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-medium">
                {message.user_name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900 dark:text-white text-sm">
                  {message.user_name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(message.created_at).toLocaleString()}
                </span>
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {message.type === 'text' ? (
                  message.content
                ) : (
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    <span className="italic">
                      {message.type === 'image' ? 'Image' : 
                       message.type === 'file' ? 'File' : 
                       message.type}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rooms..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Room Selection */}
        <div className="flex-1 overflow-y-auto max-h-64">
          {filteredRooms.length > 0 ? (
            <div className="p-2">
              {filteredRooms.map((room) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedRooms.includes(room.id)
                      ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => handleRoomToggle(room.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                      {room.type === 'group' ? (
                        <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      ) : (
                        <MessageCircle className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {room.name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {room.member_count} member{room.member_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {selectedRooms.includes(room.id) && (
                      <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <Users className="w-12 h-12 mb-4 opacity-50" />
              <p>No group rooms available</p>
              <p className="text-sm mt-1">Create a group room to forward messages</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {selectedRooms.length > 0 && (
              <span>{selectedRooms.length} room{selectedRooms.length !== 1 ? 's' : ''} selected</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleForward}
              disabled={selectedRooms.length === 0 || loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
              Forward
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default MessageForward
