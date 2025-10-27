import { useState } from 'react'
import { motion } from 'framer-motion'
import { useChatStore } from '../stores/chatStore'
import { X, AlertTriangle, Trash2 } from 'lucide-react'

const DeleteRoomModal = ({ isOpen, onClose, room }) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const { deleteRoom, leaveRoom, user } = useChatStore()

  if (!isOpen || !room) return null

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const isAdmin = room.admin_id === user?.id
      const result = isAdmin ? await deleteRoom(room.id) : await leaveRoom(room.id)
      if (result.success) {
        onClose()
      }
    } catch (error) {
      console.error('Delete/Leave room error:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const isDM = room.type === 'dm'
  const isAdmin = room.admin_id === user?.id
  const roomName = isDM ? 'Direct Message' : room.name
  const actionText = isAdmin ? 'Delete' : 'Leave'
  const actionDescription = isAdmin 
    ? 'This will permanently delete the group and all its messages. This action cannot be undone.'
    : 'You will leave this group. You can rejoin if invited by an admin.'

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
                {actionText} {isDM ? 'Direct Message' : 'Group Chat'}
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
              Are you sure you want to {actionText.toLowerCase()} <strong>"{roomName}"</strong>?
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
              <div className={`${isAdmin ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'} border rounded-lg p-4`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 ${isAdmin ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'} mt-0.5 flex-shrink-0`} />
                  <div>
                    <p className={`text-sm ${isAdmin ? 'text-red-800 dark:text-red-200' : 'text-orange-800 dark:text-orange-200'} font-medium mb-1`}>
                      {isAdmin ? 'Group Chat Deletion' : 'Leave Group'}
                    </p>
                    <p className={`text-sm ${isAdmin ? 'text-red-700 dark:text-red-300' : 'text-orange-700 dark:text-orange-300'}`}>
                      {actionDescription}
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
              className={`flex-1 px-4 py-2 ${isAdmin ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'} text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}
            >
              {isDeleting ? (
                <div className="spinner w-4 h-4" />
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  {actionText}
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
