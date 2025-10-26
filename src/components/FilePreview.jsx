import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Pause, Download, FileText, Image, Video, Music, File } from 'lucide-react'

const FilePreview = ({ file, onCancel, onSend, isUploading = false, uploadProgress = 0 }) => {
  const [preview, setPreview] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef(null)
  const videoRef = useRef(null)

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file)
      setPreview(url)
      
      return () => {
        URL.revokeObjectURL(url)
      }
    }
  }, [file])

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <Image className="w-8 h-8 text-blue-500" />
    if (type.startsWith('video/')) return <Video className="w-8 h-8 text-purple-500" />
    if (type.startsWith('audio/')) return <Music className="w-8 h-8 text-green-500" />
    if (type.includes('pdf') || type.includes('document')) return <FileText className="w-8 h-8 text-red-500" />
    return <File className="w-8 h-8 text-gray-500" />
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handlePlayPause = () => {
    if (file.type.startsWith('audio/')) {
      if (isPlaying) {
        audioRef.current?.pause()
      } else {
        audioRef.current?.play()
      }
      setIsPlaying(!isPlaying)
    } else if (file.type.startsWith('video/')) {
      if (isPlaying) {
        videoRef.current?.pause()
      } else {
        videoRef.current?.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const renderPreview = () => {
    if (file.type.startsWith('image/')) {
      return (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
            <div className="opacity-0 hover:opacity-100 transition-opacity">
              <Image className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      )
    }

    if (file.type.startsWith('video/')) {
      return (
        <div className="relative">
          <video
            ref={videoRef}
            src={preview}
            className="w-full h-48 object-cover rounded-lg"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handlePlayPause}
              className="opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded-full p-3"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Play className="w-6 h-6 text-white" />
              )}
            </motion.button>
          </div>
        </div>
      )
    }

    if (file.type.startsWith('audio/')) {
      return (
        <div className="flex items-center gap-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handlePlayPause}
            className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6" />
            )}
          </motion.button>
          <div className="flex-1">
            <div className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary-500"
                initial={{ width: 0 }}
                animate={{ width: isPlaying ? '100%' : '0%' }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </div>
          <audio
            ref={audioRef}
            src={preview}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />
        </div>
      )
    }

    // Document preview
    return (
      <div className="flex items-center gap-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
        {getFileIcon(file.type)}
        <div className="flex-1">
          <p className="font-medium text-gray-900 dark:text-white truncate">
            {file.name}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatFileSize(file.size)}
          </p>
        </div>
        <Download className="w-5 h-5 text-gray-400" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {getFileIcon(file.type)}
          <div>
            <p className="font-medium text-gray-900 dark:text-white text-sm truncate max-w-48">
              {file.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatFileSize(file.size)}
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onCancel}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Preview Content */}
      <div className="p-3">
        {renderPreview()}
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="px-3 pb-3">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Uploading...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary-500"
              initial={{ width: 0 }}
              animate={{ width: `${uploadProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      {!isUploading && (
        <div className="flex items-center justify-end gap-2 p-3 border-t border-gray-200 dark:border-gray-700">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSend}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Send
          </motion.button>
        </div>
      )}
    </motion.div>
  )
}

export default FilePreview
