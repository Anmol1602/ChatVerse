import { useState } from 'react'
import { motion } from 'framer-motion'
import { useChatStore } from '../stores/chatStore'
import { X, AlertTriangle, Trash2 } from 'lucide-react'

const DeleteRoomModal = ({ isOpen, onClose, room }) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const { deleteRoom } = useChatStore()

  if (!isOpen || !room) return null

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteRoom(room.id)
      if (result.success) {
        onClose()
      }
    } catch (error) {
      console.error('Delete room error:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const isDM = room.type === 'dm'
  const roomName = isDM ? 'Direct Message' : room.name

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Delete {isDM ? 'Direct Message' : 'Group Chat'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete <strong>"{roomName}"</strong>?
            </p>
            
            {isDM ? (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-1">
                      Direct Message Deletion
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      This will delete the entire conversation for both users. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-1">
                      Group Chat Deletion
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      This will permanently delete the group chat and all messages. All members will lose access to this room.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <div className="spinner w-4 h-4" />
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default DeleteRoomModal
