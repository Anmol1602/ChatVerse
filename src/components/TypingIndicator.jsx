import { motion } from 'framer-motion'
import { useChatStore } from '../stores/chatStore'

const TypingIndicator = ({ roomId }) => {
  const { typingUsers, users } = useChatStore()
  
  if (typingUsers.size === 0) return null

  const typingUserNames = Array.from(typingUsers)
    .map(userId => {
      const user = users.find(u => u.id === userId)
      return user?.name || 'Someone'
    })
    .slice(0, 3) // Show max 3 names

  const getTypingText = () => {
    if (typingUserNames.length === 1) {
      return `${typingUserNames[0]} is typing...`
    } else if (typingUserNames.length === 2) {
      return `${typingUserNames[0]} and ${typingUserNames[1]} are typing...`
    } else {
      return `${typingUserNames[0]}, ${typingUserNames[1]} and ${typingUserNames.length - 2} others are typing...`
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 dark:text-gray-400"
    >
      <div className="flex gap-1">
        <motion.div
          className="w-2 h-2 bg-gray-400 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
        />
        <motion.div
          className="w-2 h-2 bg-gray-400 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
        />
        <motion.div
          className="w-2 h-2 bg-gray-400 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
        />
      </div>
      <span>{getTypingText()}</span>
    </motion.div>
  )
}

export default TypingIndicator
