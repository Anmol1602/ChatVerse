import { motion } from 'framer-motion'
import { formatTime } from '../utils/formatTime'
import { User } from 'lucide-react'

const MessageBubble = ({ message, isOwn, showAvatar = false, showTime = true }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-end gap-2 mb-4 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {showAvatar && !isOwn && (
        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
          {message.user_avatar ? (
            <img
              src={message.user_avatar}
              alt={message.user_name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          )}
        </div>
      )}
      
      <div className={`flex flex-col max-w-xs lg:max-w-md ${isOwn ? 'items-end' : 'items-start'}`}>
        {showAvatar && !isOwn && (
          <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {message.user_name}
          </span>
        )}
        
        <div
          className={`px-4 py-2 rounded-lg ${
            isOwn
              ? 'bg-primary-600 text-white rounded-br-sm'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm'
          }`}
        >
          <p className="text-sm break-words whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
        
        {showTime && (
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formatTime(message.created_at)}
          </span>
        )}
      </div>
    </motion.div>
  )
}

export default MessageBubble
