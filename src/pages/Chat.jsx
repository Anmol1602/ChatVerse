import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '../stores/authStore'
import { useChatStore } from '../stores/chatStore'
import Sidebar from '../components/Sidebar'
import ChatArea from '../components/ChatArea'
import LoadingSpinner from '../components/LoadingSpinner'
import ThemeToggle from '../components/ThemeToggle'

const Chat = () => {
  const { user, logout } = useAuthStore()
  const { fetchRooms, loading, stopMessagePolling, startRoomsPolling, stopRoomsPolling } = useChatStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const hasFetchedRooms = useRef(false)

  useEffect(() => {
    console.log('Chat useEffect triggered, user:', user?.id, 'hasFetchedRooms:', hasFetchedRooms.current)
    // Only fetch rooms once per user
    if (!hasFetchedRooms.current && user) {
      hasFetchedRooms.current = true
      console.log('Fetching rooms for user:', user.id)
      fetchRooms()
      // Re-enable rooms polling with smart debouncing to prevent page reloads
      startRoomsPolling()
    }
  }, [user?.id]) // Only depend on user ID, not the entire user object

  // Cleanup polling when component unmounts
  useEffect(() => {
    return () => {
      stopMessagePolling()
      stopRoomsPolling()
    }
  }, []) // Remove function dependencies to prevent infinite loops

  if (loading) {
    return <LoadingSpinner size="lg" className="min-h-screen" />
  }

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
        </div>
      )}

      {/* Sidebar - Fixed width and height */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-80 lg:w-1/4 bg-white dark:bg-gray-800 
          border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </motion.div>

      {/* Main chat area - Takes remaining width */}
      <div className="flex-1 lg:w-3/4 flex flex-col h-screen min-w-0">
        {/* Header - Fixed at top */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                ChatVerse
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Welcome back, {user?.name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={logout}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Chat area - Scrollable and grows to fill space */}
        <div className="flex-1 flex flex-col min-h-0">
          <ChatArea />
        </div>
      </div>
    </div>
  )
}

export default Chat
