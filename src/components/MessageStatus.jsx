import { Check, CheckCheck, Clock } from 'lucide-react'
import { formatTime } from '../utils/formatTime'
import { useChatStore } from '../stores/chatStore'

const MessageStatus = ({ message, isOwn }) => {
  if (!isOwn) return null

  const getStatusIcon = () => {
    if (!message.read_by || message.read_by.length === 0) {
      return <Check className="w-3 h-3 text-gray-400" />
    }

    // Check if current user has read the message
    const currentUserId = useChatStore.getState().user?.id
    const hasRead = message.read_by.includes(currentUserId)

    if (hasRead) {
      return <CheckCheck className="w-3 h-3 text-blue-500" />
    }

    return <Check className="w-3 h-3 text-gray-400" />
  }

  const getStatusText = () => {
    if (!message.read_by || message.read_by.length === 0) {
      return 'Sent'
    }

    const currentUserId = useChatStore.getState().user?.id
    const hasRead = message.read_by.includes(currentUserId)

    if (hasRead) {
      return 'Read'
    }

    return 'Delivered'
  }

  const getReadTime = () => {
    if (!message.read_by || message.read_by.length === 0) {
      return null
    }

    const currentUserId = useChatStore.getState().user?.id
    const hasRead = message.read_by.includes(currentUserId)

    if (hasRead && message.read_at) {
      return formatTime(message.read_at)
    }

    return null
  }

  return (
    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
      {getStatusIcon()}
      <span>{getStatusText()}</span>
      {getReadTime() && (
        <span className="ml-1">• {getReadTime()}</span>
      )}
    </div>
  )
}

export default MessageStatus
