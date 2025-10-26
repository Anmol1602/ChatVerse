import { useState, useRef, useEffect } from 'react'
import { Send, Smile, Paperclip } from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'
import { useChatStore } from '../stores/chatStore'
import { wsManager } from '../utils/websocket'
import FileUpload from './FileUpload'
import FilePreview from './FilePreview'
import TempMessageBubble from './TempMessageBubble'

const MessageInput = ({ roomId }) => {
  const [message, setMessage] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [tempMessage, setTempMessage] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const { sendMessage, sendFile, user } = useChatStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation() // Prevent event bubbling
    
    if (!message.trim() || !roomId) return

    const content = message.trim()
    setMessage('')
    setShowEmojiPicker(false)
    
    // Stop typing indicator
    if (isTyping) {
      wsManager.sendStopTyping(roomId)
      setIsTyping(false)
    }

    try {
      console.log('Sending message:', content)
      const result = await sendMessage(content)
      console.log('Message send result:', result)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleInputChange = (e) => {
    setMessage(e.target.value)
    
    // Send typing indicator
    if (!isTyping && roomId) {
      wsManager.sendTyping(roomId)
      setIsTyping(true)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping && roomId) {
        wsManager.sendStopTyping(roomId)
        setIsTyping(false)
      }
    }, 2000)
  }

  const handleEmojiClick = (emojiData) => {
    setMessage(prev => prev + emojiData.emoji)
    inputRef.current?.focus()
  }

  const handleFileSelect = (file) => {
    setSelectedFile(file)
    setShowFileUpload(false)
  }

  const handleFileCancel = () => {
    setSelectedFile(null)
    setTempMessage(null)
    setUploadProgress(0)
  }

  const handleFileSend = async () => {
    if (!selectedFile) return

    // Create temporary message
    const tempMsg = {
      id: `temp-${Date.now()}`,
      type: selectedFile.type.startsWith('image/') ? 'image' : 
            selectedFile.type.startsWith('video/') ? 'video' :
            selectedFile.type.startsWith('audio/') ? 'audio' : 'document',
      fileName: selectedFile.name,
      fileType: selectedFile.type,
      fileSize: formatFileSize(selectedFile.size),
      preview: URL.createObjectURL(selectedFile),
      status: 'uploading',
      user_id: user?.id,
      user_name: user?.name,
      user_avatar: user?.avatar,
      created_at: new Date().toISOString()
    }

    setTempMessage(tempMsg)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      console.log('Sending file:', selectedFile.name)
      const result = await sendFile(selectedFile)
      
      clearInterval(progressInterval)
      setUploadProgress(100)

      if (result.success) {
        // Update temp message to success
        setTempMessage(prev => ({ ...prev, status: 'success' }))
        
        // Clear after a short delay
        setTimeout(() => {
          setSelectedFile(null)
          setTempMessage(null)
          setUploadProgress(0)
        }, 1000)
      } else {
        // Update temp message to error
        setTempMessage(prev => ({ ...prev, status: 'error' }))
      }
      
      console.log('File send result:', result)
    } catch (error) {
      console.error('Failed to send file:', error)
      setTempMessage(prev => ({ ...prev, status: 'error' }))
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      const file = files[0] // Take the first file
      if (file.size <= 10 * 1024 * 1024) { // 10MB limit
        handleFileSelect(file)
      } else {
        alert('File size must be less than 10MB')
      }
    }
  }

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (isTyping && roomId) {
        wsManager.sendStopTyping(roomId)
      }
    }
  }, [isTyping, roomId])

  return (
    <div 
      className="relative flex-shrink-0"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-primary-500 bg-opacity-20 border-2 border-dashed border-primary-500 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-2">📎</div>
            <p className="text-primary-700 dark:text-primary-300 font-medium">
              Drop file here to upload
            </p>
          </div>
        </div>
      )}

      {/* File Preview */}
      {selectedFile && (
        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <FilePreview
            file={selectedFile}
            onCancel={handleFileCancel}
            onSend={handleFileSend}
            isUploading={tempMessage?.status === 'uploading'}
            uploadProgress={uploadProgress}
          />
        </div>
      )}

      {/* Temporary Message */}
      {tempMessage && (
        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <TempMessageBubble message={tempMessage} isOwn={true} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setShowFileUpload(true)}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <Smile className="w-5 h-5" />
        </button>
        
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
            rows="1"
            style={{ minHeight: '40px', maxHeight: '120px' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
          />
        </div>
        
        <button
          type="submit"
          disabled={!message.trim()}
          className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          onClick={(e) => {
            if (!message.trim()) {
              e.preventDefault()
              e.stopPropagation()
            }
          }}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {showEmojiPicker && (
        <div className="absolute bottom-full left-0 mb-2 z-10">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            width={300}
            height={400}
            searchDisabled={false}
            skinTonesDisabled={false}
            previewConfig={{
              showPreview: false
            }}
          />
        </div>
      )}

      {showFileUpload && (
        <FileUpload
          onFileSelect={handleFileSelect}
          onClose={() => setShowFileUpload(false)}
        />
      )}
    </div>
  )
}

export default MessageInput
