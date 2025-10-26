import { motion } from 'framer-motion'
import { Image, Video, Music, FileText, File, Upload, CheckCircle, XCircle } from 'lucide-react'

const TempMessageBubble = ({ message, isOwn = true }) => {
  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <Image className="w-5 h-5" />
    if (type.startsWith('video/')) return <Video className="w-5 h-5" />
    if (type.startsWith('audio/')) return <Music className="w-5 h-5" />
    if (type.includes('pdf') || type.includes('document')) return <FileText className="w-5 h-5" />
    return <File className="w-5 h-5" />
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'uploading':
        return <Upload className="w-3 h-3 animate-pulse" />
      case 'success':
        return <CheckCircle className="w-3 h-3 text-green-500" />
      case 'error':
        return <XCircle className="w-3 h-3 text-red-500" />
      default:
        return <Upload className="w-3 h-3" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'uploading':
        return 'Uploading...'
      case 'success':
        return 'Sent'
      case 'error':
        return 'Failed'
      default:
        return 'Uploading...'
    }
  }

  const renderPreview = () => {
    if (message.type === 'image' && message.preview) {
      return (
        <div className="relative">
          <img
            src={message.preview}
            alt="Preview"
            className="w-48 h-32 object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
            <div className="bg-black bg-opacity-50 rounded-full p-2">
              {getFileIcon(message.fileType)}
            </div>
          </div>
        </div>
      )
    }

    if (message.type === 'video' && message.preview) {
      return (
        <div className="relative">
          <video
            src={message.preview}
            className="w-48 h-32 object-cover rounded-lg"
            muted
          />
          <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
            <div className="bg-black bg-opacity-50 rounded-full p-2">
              {getFileIcon(message.fileType)}
            </div>
          </div>
        </div>
      )
    }

    // Default file preview
    return (
      <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-600 rounded-lg w-48">
        {getFileIcon(message.fileType)}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {message.fileName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {message.fileSize}
          </p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className={`flex items-end gap-2 mb-4 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div className={`flex flex-col max-w-xs ${isOwn ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-2 rounded-lg relative ${
            isOwn
              ? 'bg-primary-500 text-white rounded-br-sm'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm'
          }`}
        >
          {renderPreview()}
          
          {/* Status indicator */}
          <div className={`flex items-center gap-1 mt-2 text-xs ${
            isOwn ? 'text-white' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {getStatusIcon(message.status)}
            <span>{getStatusText(message.status)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default TempMessageBubble
