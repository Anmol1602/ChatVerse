import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Smile, Heart, ThumbsUp, Laugh, Angry, Frown } from 'lucide-react'
import { useChatStore } from '../stores/chatStore'

const REACTION_EMOJIS = {
  '👍': { icon: ThumbsUp, label: 'Like' },
  '❤️': { icon: Heart, label: 'Love' },
  '😂': { icon: Laugh, label: 'Laugh' },
  '😢': { icon: Frown, label: 'Sad' },
  '😡': { icon: Angry, label: 'Angry' },
  '😮': { icon: Smile, label: 'Wow' }
}

const MessageReactions = ({ message, isOwn }) => {
  const [showPicker, setShowPicker] = useState(false)
  const { addReaction, removeReaction, user } = useChatStore()

  const handleReactionClick = async (emoji) => {
    const existingReaction = message.reactions?.find(r => r.emoji === emoji)
    
    if (existingReaction) {
      // Remove reaction if user already reacted with this emoji
      await removeReaction(message.id, emoji)
    } else {
      // Add new reaction
      await addReaction(message.id, emoji)
    }
    
    setShowPicker(false)
  }

  const getReactionCount = (emoji) => {
    return message.reactions?.filter(r => r.emoji === emoji).length || 0
  }

  const getUserReaction = () => {
    if (!message.reactions) return null
    return message.reactions.find(r => r.user_id === user?.id)
  }

  const renderReactionBubble = (emoji, count) => {
    if (count === 0) return null
    
    const userReacted = message.reactions?.some(r => 
      r.emoji === emoji && r.user_id === user?.id
    )

    return (
      <motion.button
        key={emoji}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => handleReactionClick(emoji)}
        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
          userReacted
            ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
      >
        <span className="text-sm">{emoji}</span>
        <span className="font-medium">{count}</span>
      </motion.button>
    )
  }

  return (
    <div className="flex items-center gap-1 mt-1">
      {/* Reaction bubbles */}
      <div className="flex items-center gap-1">
        {Object.keys(REACTION_EMOJIS).map(emoji => {
          const count = getReactionCount(emoji)
          return renderReactionBubble(emoji, count)
        })}
      </div>

      {/* Add reaction button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowPicker(!showPicker)}
        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        title="Add reaction"
      >
        <Smile className="w-3 h-3" />
      </motion.button>

      {/* Reaction picker */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 z-10"
          >
            <div className="flex items-center gap-1">
              {Object.entries(REACTION_EMOJIS).map(([emoji, { label }]) => (
                <motion.button
                  key={emoji}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleReactionClick(emoji)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title={label}
                >
                  <span className="text-lg">{emoji}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MessageReactions
