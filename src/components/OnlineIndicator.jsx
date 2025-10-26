import { motion } from 'framer-motion'
import { Circle } from 'lucide-react'

const OnlineIndicator = ({ user, showName = false, size = 'sm' }) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return 'w-2 h-2'
      case 'sm':
        return 'w-3 h-3'
      case 'md':
        return 'w-4 h-4'
      case 'lg':
        return 'w-5 h-5'
      default:
        return 'w-3 h-3'
    }
  }

  const getStatusColor = () => {
    if (user.online) {
      return 'bg-green-500'
    }
    
    // Check if user was recently active (within last 5 minutes)
    if (user.last_seen) {
      const lastSeen = new Date(user.last_seen)
      const now = new Date()
      const diffMinutes = (now - lastSeen) / (1000 * 60)
      
      if (diffMinutes < 5) {
        return 'bg-yellow-500' // Recently active
      }
    }
    
    return 'bg-gray-400' // Offline
  }

  const getStatusText = () => {
    if (user.online) {
      return 'Online'
    }
    
    if (user.last_seen) {
      const lastSeen = new Date(user.last_seen)
      const now = new Date()
      const diffMinutes = (now - lastSeen) / (1000 * 60)
      
      if (diffMinutes < 1) {
        return 'Just now'
      } else if (diffMinutes < 60) {
        return `${Math.floor(diffMinutes)}m ago`
      } else if (diffMinutes < 1440) {
        return `${Math.floor(diffMinutes / 60)}h ago`
      } else {
        return `${Math.floor(diffMinutes / 1440)}d ago`
      }
    }
    
    return 'Offline'
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <motion.div
          className={`${getSizeClasses()} ${getStatusColor()} rounded-full`}
          animate={user.online ? { scale: [1, 1.2, 1] } : {}}
          transition={user.online ? { duration: 2, repeat: Infinity } : {}}
        />
        {user.online && (
          <motion.div
            className={`${getSizeClasses()} ${getStatusColor()} rounded-full absolute inset-0 opacity-30`}
            animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </div>
      
      {showName && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {getStatusText()}
        </span>
      )}
    </div>
  )
}

export default OnlineIndicator
