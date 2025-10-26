import { Clock, Check, CheckCheck } from 'lucide-react'

const MessageStatus = ({ message, isOwn }) => {
  if (!isOwn) return null

  const getStatusIcon = () => {
    // Simulate different statuses based on message age and other factors
    const messageTime = new Date(message.created_at)
    const now = new Date()
    const timeDiff = now - messageTime
    
    // If message is very recent (less than 5 seconds), show sending
    if (timeDiff < 5000) {
      return {
        icon: <Clock className="w-3 h-3" />,
        color: 'text-gray-400',
        status: 'sending'
      }
    }
    
    // If message is recent (less than 1 minute), show sent
    if (timeDiff < 60000) {
      return {
        icon: <Check className="w-3 h-3" />,
        color: 'text-gray-400',
        status: 'sent'
      }
    }
    
    // If message is older (more than 1 minute), show delivered
    if (timeDiff < 300000) { // 5 minutes
      return {
        icon: <CheckCheck className="w-3 h-3" />,
        color: 'text-gray-400',
        status: 'delivered'
      }
    }
    
    // If message is very old (more than 5 minutes), show read
    return {
      icon: <CheckCheck className="w-3 h-3" />,
      color: 'text-blue-500',
      status: 'read'
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const status = getStatusIcon()

  return (
    <div className="flex items-center gap-1 mt-1">
      <span className="text-xs text-gray-400">
        {formatTime(message.created_at)}
      </span>
      <div className={`${status.color} flex items-center`}>
        {status.icon}
      </div>
    </div>
  )
}

export default MessageStatus