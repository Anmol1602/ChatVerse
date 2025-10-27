import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useChatStore } from '../stores/chatStore'
import { X, Users, UserPlus, UserMinus, Search, Crown, Trash2 } from 'lucide-react'
import UserSearchModal from './UserSearchModal'
import AdminBadge from './AdminBadge'
import ConfirmationModal from './ConfirmationModal'
import TransferAdminModal from './TransferAdminModal'

const RoomMembersModal = ({ isOpen, onClose, roomId }) => {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddUser, setShowAddUser] = useState(false)
  const [showTransferAdmin, setShowTransferAdmin] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState(null)
  const [roomInfo, setRoomInfo] = useState(null)
  const { 
    fetchRoomMembers, 
    addMemberToRoom, 
    removeMember, 
    transferAdminRole,
    leaveRoom,
    user,
    currentRoom
  } = useChatStore()

  useEffect(() => {
    if (isOpen && roomId) {
      loadMembers()
    }
  }, [isOpen, roomId])

  const loadMembers = async () => {
    setLoading(true)
    console.log('Loading members for roomId:', roomId)
    const result = await fetchRoomMembers(roomId)
    console.log('Load members result:', result)
    if (result.success) {
      setMembers(result.members)
      setRoomInfo(result.room)
      console.log('Set members:', result.members)
      console.log('Set room info:', result.room)
    } else {
      console.error('Failed to load members:', result.error)
    }
    setLoading(false)
  }

  const handleAddMember = async (userId) => {
    const result = await addMemberToRoom(roomId, userId)
    if (result.success) {
      loadMembers() // Refresh members list
      setShowAddUser(false)
    }
  }

  const handleRemoveMember = async (userId) => {
    const result = await removeMember(roomId, userId)
    if (result.success) {
      loadMembers() // Refresh members list
    } else {
      alert(result.error || 'Failed to remove member')
    }
  }

  const handleRemoveMemberClick = (member) => {
    setMemberToRemove(member)
    setShowRemoveConfirm(true)
  }

  const confirmRemoveMember = async () => {
    if (memberToRemove) {
      await handleRemoveMember(memberToRemove.id)
      setShowRemoveConfirm(false)
      setMemberToRemove(null)
    }
  }

  const handleTransferAdmin = () => {
    setShowTransferAdmin(true)
  }

  const handleLeaveGroup = async () => {
    const result = await leaveRoom(roomId)
    if (result.success) {
      onClose()
    }
  }

  // Check if current user is admin
  const isAdmin = roomInfo?.admin_id === user?.id
  const isCurrentUser = (memberId) => memberId === user?.id

  if (!isOpen) return null

  return (
    <>
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
          className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col"
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Room Members
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddUser(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Add Member
              </button>
              
              {/* Admin-only buttons */}
              {isAdmin && (
                <>
                  <button
                    onClick={handleTransferAdmin}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    title="Transfer admin role"
                  >
                    <Crown className="w-4 h-4" />
                    Transfer Admin
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="spinner w-6 h-6" />
              </div>
            ) : members.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  No members found
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {members.map((member) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                      {member.avatar ? (
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {member.name}
                        </p>
                        {roomInfo?.admin_id === member.id && (
                          <AdminBadge />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {member.online ? (
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Online
                          </span>
                        ) : (
                          'Offline'
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Admin management buttons - only show for admin */}
                      {isAdmin && !isCurrentUser(member.id) && (
                        <button
                          onClick={() => handleRemoveMemberClick(member)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
                          title="Remove member"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* Leave group button for current user */}
                      {isCurrentUser(member.id) && (
                        <button
                          onClick={handleLeaveGroup}
                          className="p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900 rounded-lg transition-colors"
                          title="Leave group"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {showAddUser && (
        <UserSearchModal
          isOpen={showAddUser}
          onClose={() => setShowAddUser(false)}
          onUserSelect={handleAddMember}
        />
      )}

      {/* Confirmation modals */}
      <ConfirmationModal
        isOpen={showRemoveConfirm}
        onClose={() => setShowRemoveConfirm(false)}
        onConfirm={confirmRemoveMember}
        title="Remove Member"
        message={`Are you sure you want to remove ${memberToRemove?.name} from this group?`}
        confirmText="Remove"
        type="danger"
      />

      <TransferAdminModal
        isOpen={showTransferAdmin}
        onClose={() => setShowTransferAdmin(false)}
        currentAdminId={user?.id}
        roomId={roomId}
      />
    </>
  )
}

export default RoomMembersModal
