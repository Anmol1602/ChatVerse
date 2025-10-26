import React from 'react';
import { motion } from 'framer-motion';

const ReactionDisplay = ({ reactions, onReactionClick, isOverlay = false, className = "" }) => {
  if (!reactions || reactions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex gap-1 text-sm ${isOverlay ? 'bg-white/70 backdrop-blur-md rounded-full px-2 py-1' : 'bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full w-fit items-center'} ${className}`}
    >
      {reactions.map((reaction, index) => (
        <motion.button
          key={`${reaction.emoji}-${index}`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onReactionClick && onReactionClick(reaction.emoji)}
          className="flex items-center gap-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full px-1 py-0.5 transition-colors"
          title={`${reaction.users.map(u => u.name).join(', ')} ${reaction.emoji}`}
        >
          <span className="text-sm">{reaction.emoji}</span>
          <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
            {reaction.count}
          </span>
        </motion.button>
      ))}
    </motion.div>
  );
};

export default ReactionDisplay;
