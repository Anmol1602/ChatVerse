import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, ArrowUp, ArrowDown, MessageCircle } from 'lucide-react'
import { useChatStore } from '../stores/chatStore'

const MessageSearch = ({ isOpen, onClose, roomId }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const { searchMessages } = useChatStore()
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch()
    } else {
      setSearchResults([])
      setCurrentIndex(-1)
    }
  }, [searchQuery, roomId])

  const performSearch = async () => {
    if (!searchQuery.trim() || !roomId) return

    setLoading(true)
    try {
      const results = await searchMessages(roomId, searchQuery.trim())
      setSearchResults(results)
      setCurrentIndex(results.length > 0 ? 0 : -1)
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (searchResults.length > 0) {
        scrollToMessage(searchResults[currentIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCurrentIndex(prev => 
        prev < searchResults.length - 1 ? prev + 1 : 0
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCurrentIndex(prev => 
        prev > 0 ? prev - 1 : searchResults.length - 1
      )
    }
  }

  const scrollToMessage = (message) => {
    // This would scroll to the message in the chat area
    // For now, we'll just log it
    console.log('Scrolling to message:', message)
    // You could emit an event or use a ref to scroll to the message
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      return 'Today'
    } else if (diffDays === 2) {
      return 'Yesterday'
    } else if (diffDays <= 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' })
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      })
    }
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const highlightText = (text, query) => {
    if (!query) return text
    
    const regex = new RegExp(`(${query})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : part
    )
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
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
            Search Messages
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search messages..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            {loading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          
          {searchQuery && (
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {searchResults.length > 0 ? (
                <span>
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                  {currentIndex >= 0 && (
                    <span className="ml-2">
                      ({currentIndex + 1} of {searchResults.length})
                    </span>
                  )}
                </span>
              ) : (
                <span>No results found</span>
              )}
            </div>
          )}
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {searchResults.length > 0 ? (
            <div className="p-2">
              {searchResults.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    index === currentIndex
                      ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => scrollToMessage(message)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {message.user_name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-white text-sm">
                          {message.user_name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(message.created_at)} at {formatTime(message.created_at)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {message.type === 'text' ? (
                          highlightText(message.content, searchQuery)
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
                </motion.div>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mb-4 opacity-50" />
              <p>No messages found for "{searchQuery}"</p>
              <p className="text-sm mt-1">Try different keywords</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mb-4 opacity-50" />
              <p>Search for messages in this conversation</p>
              <p className="text-sm mt-1">Type to start searching</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {searchResults.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <ArrowUp className="w-4 h-4" />
                  <ArrowDown className="w-4 h-4" />
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs">Enter</kbd>
                  <span>Go to message</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs">Esc</kbd>
                <span>Close</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default MessageSearch
