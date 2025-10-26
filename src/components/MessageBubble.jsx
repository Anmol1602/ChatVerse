import { motion } from 'framer-motion'
import { formatTime } from '../utils/formatTime'
import { User, Trash2, Download, Image, File, FileText, Music, Video, Archive, Forward } from 'lucide-react'
import { useChatStore } from '../stores/chatStore'
import { useState, useRef } from 'react'
import MessageReactions from './MessageReactions'
import MessageStatus from './MessageStatus'
import MessageForward from './MessageForward'
import EmojiPicker from './EmojiPicker'
import ReactionDisplay from './ReactionDisplay'
import ReactionButton from './ReactionButton'

const MessageBubble = ({ message, isOwn, showAvatar = false, showTime = true }) => {
  const { deleteMessage, toggleReaction, fetchReactions } = useChatStore()
  const [showDelete, setShowDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showForward, setShowForward] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [pickerPosition, setPickerPosition] = useState({ x: 0, y: 0 })
  const messageRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      setIsDeleting(true)
      const result = await deleteMessage(message.id)
      if (!result.success) {
        alert(result.error || 'Failed to delete message')
      }
      setIsDeleting(false)
    }
  }

  const handleReactionClick = () => {
    if (messageRef.current) {
      const rect = messageRef.current.getBoundingClientRect()
      setPickerPosition({
        x: rect.right - 20,
        y: rect.top
      })
    }
    setShowEmojiPicker(true)
  }

  const handleEmojiSelect = async (emoji) => {
    await toggleReaction(message.id, emoji)
    setShowEmojiPicker(false)
  }

  const handleReactionToggle = async (emoji) => {
    await toggleReaction(message.id, emoji)
  }

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <Image className="w-5 h-5" />
    if (fileType.startsWith('video/')) return <Video className="w-5 h-5" />
    if (fileType.startsWith('audio/')) return <Music className="w-5 h-5" />
    if (fileType.includes('pdf') || fileType.includes('document')) return <FileText className="w-5 h-5" />
    if (fileType.includes('zip') || fileType.includes('rar')) return <Archive className="w-5 h-5" />
    return <File className="w-5 h-5" />
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleFileDownload = (file) => {
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.name
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderFileMessage = () => {
    if (message.type !== 'file') return null

    console.log('File message data:', message)

    // Parse file data from content if it's a string
    let fileData
    try {
      fileData = typeof message.content === 'string' ? JSON.parse(message.content) : message.content
    } catch (error) {
      console.error('Failed to parse file content:', error)
      return null
    }

    const file = fileData?.file
    if (!file) {
      console.log('No file data found in:', fileData)
      return null
    }
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    const isAudio = file.type.startsWith('audio/')

    return (
      <div className="max-w-xs">
        {isImage ? (
          <div className="space-y-2">
            <div className="relative group">
              <img
                src={file.url}
                alt={file.name}
                className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(file.url, '_blank')}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Image className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className={`truncate ${isOwn ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                {file.name}
              </span>
              <span className={`${isOwn ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                ({formatFileSize(file.size)})
              </span>
            </div>
          </div>
        ) : isVideo ? (
          <div className="space-y-2">
            <div className="relative group">
              <video
                src={file.url}
                className="rounded-lg max-w-full h-auto cursor-pointer"
                controls
                preload="metadata"
              />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className={`truncate ${isOwn ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                {file.name}
              </span>
              <span className={`${isOwn ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                ({formatFileSize(file.size)})
              </span>
            </div>
          </div>
        ) : isAudio ? (
          <div className="space-y-2">
            <div className={`flex items-center gap-3 p-3 rounded-lg ${
              isOwn ? 'bg-white bg-opacity-20' : 'bg-gray-100 dark:bg-gray-600'
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isOwn ? 'bg-white bg-opacity-30' : 'bg-primary-500'
              }`}>
                <Music className={`w-5 h-5 ${isOwn ? 'text-white' : 'text-white'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isOwn ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                  {file.name}
                </p>
                <p className={`text-xs ${isOwn ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>
            <audio
              src={file.url}
              controls
              className="w-full"
              preload="metadata"
            />
          </div>
        ) : (
          <div className={`flex items-center gap-3 p-3 rounded-lg ${
            isOwn ? 'bg-white bg-opacity-20' : 'bg-gray-100 dark:bg-gray-600'
          }`}>
            {getFileIcon(file.type)}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${isOwn ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                {file.name}
              </p>
              <p className={`text-xs ${isOwn ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                {formatFileSize(file.size)}
              </p>
            </div>
            <button
              onClick={() => handleFileDownload(file)}
              className={`p-1 transition-colors ${
                isOwn 
                  ? 'text-white hover:text-gray-200' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    )
  }

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
      
      <div className={`flex flex-col max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {showAvatar && !isOwn && (
          <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {message.user_name}
          </span>
        )}
        
        <div
          ref={messageRef}
          className={`rounded-2xl p-3 relative group ${
            isOwn
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
          }`}
          onMouseEnter={() => {
            setShowDelete(true)
            setIsHovered(true)
          }}
          onMouseLeave={() => {
            setShowDelete(false)
            setIsHovered(false)
          }}
        >
          {message.type === 'file' ? (
            <div className="relative">
              {renderFileMessage()}
              {/* Timestamp and status at bottom-right for file messages */}
              <div className="flex items-center justify-end gap-1 mt-2">
                <span className="text-xs text-gray-400">
                  {formatTime(message.created_at)}
                </span>
                <MessageStatus message={message} isOwn={isOwn} />
              </div>
              {/* Reaction overlay for media messages */}
              {message.reactions && message.reactions.length > 0 && (
                <div className="absolute bottom-2 right-2">
                  <ReactionDisplay
                    reactions={message.reactions}
                    onReactionClick={handleReactionToggle}
                    isOverlay={true}
                  />
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-sm break-words whitespace-pre-wrap">
                {message.content}
              </p>
              {/* Timestamp and status at bottom-right */}
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className="text-xs text-gray-400">
                  {formatTime(message.created_at)}
                </span>
                <MessageStatus message={message} isOwn={isOwn} />
              </div>
            </div>
          )}
          
          
          {/* Action buttons */}
          {showDelete && (
            <div className="absolute -top-2 -right-2 flex gap-1">
              {/* Emoji reaction button - show for all messages */}
              <button
                onClick={handleReactionClick}
                className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center hover:bg-yellow-600 transition-colors"
                title="Add reaction"
              >
                😃
              </button>
              
              {/* Forward button - show for all messages */}
              <button
                onClick={() => setShowForward(true)}
                className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                title="Forward message"
              >
                <Forward className="w-3 h-3" />
              </button>
              
              {/* Delete button - only show for own messages */}
              {isOwn && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  title="Delete message"
                >
                  {isDeleting ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Text message reactions - below the bubble */}
        {message.type !== 'file' && message.reactions && message.reactions.length > 0 && (
          <div className="mt-1">
            <ReactionDisplay
              reactions={message.reactions}
              onReactionClick={handleReactionToggle}
              isOverlay={false}
            />
          </div>
        )}
        
        
      </div>

      {/* Emoji picker */}
      <EmojiPicker
        isOpen={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onEmojiSelect={handleEmojiSelect}
        position={pickerPosition}
      />

      {/* Forward message modal */}
      <MessageForward
        isOpen={showForward}
        onClose={() => setShowForward(false)}
        message={message}
      />
    </motion.div>
  )
}

export default MessageBubble
