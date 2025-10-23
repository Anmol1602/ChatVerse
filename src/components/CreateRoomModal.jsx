import { useState } from 'react'
import { motion } from 'framer-motion'
import { useChatStore } from '../stores/chatStore'
import { X, Users, MessageCircle, Plus } from 'lucide-react'
import UserSearchModal from './UserSearchModal'

const CreateRoomModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'group'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState([])
  const [showUserSearch, setShowUserSearch] = useState(false)
  const { createRoom } = useChatStore()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setIsLoading(true)
    const memberIds = selectedMembers.map(member => member.id)
    const result = await createRoom(
      formData.name.trim(),
      formData.description.trim(),
      formData.type,
      memberIds
    )
    
    if (result.success) {
      onClose()
    }
    setIsLoading(false)
  }

  const handleAddMember = (user) => {
    console.log('handleAddMember called with user:', user)
    console.log('Current selectedMembers:', selectedMembers)
    if (!selectedMembers.find(member => member.id === user.id)) {
      console.log('Adding user to selectedMembers:', user)
      setSelectedMembers([...selectedMembers, user])
    } else {
      console.log('User already in selectedMembers:', user.id)
    }
  }

  const handleRemoveMember = (userId) => {
    setSelectedMembers(selectedMembers.filter(member => member.id !== userId))
  }

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
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Create New Room
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Room Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter room name"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter room description"
                className="input-field"
                rows="3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Room Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`relative flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  formData.type === 'group'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}>
                  <input
                    type="radio"
                    name="type"
                    value="group"
                    checked={formData.type === 'group'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-medium">Group</span>
                  </div>
                </label>

                <label className={`relative flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  formData.type === 'direct'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}>
                  <input
                    type="radio"
                    name="type"
                    value="direct"
                    checked={formData.type === 'direct'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Direct</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Member Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Add Members (Optional)
                </label>
                <button
                  type="button"
                  onClick={() => setShowUserSearch(true)}
                  className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  <Plus className="w-4 h-4" />
                  Add Member
                </button>
              </div>
              
              {selectedMembers.length > 0 && (
                <div className="space-y-2">
                  {selectedMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {member.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {member.email}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.name.trim()}
                className="flex-1 btn-primary flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="spinner w-4 h-4" />
                ) : (
                  'Create Room'
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>

      {/* User Search Modal */}
      {showUserSearch && (
        <UserSearchModal
          onClose={() => setShowUserSearch(false)}
          onUserSelect={handleAddMember}
        />
      )}
    </div>
  )
}

export default CreateRoomModal
