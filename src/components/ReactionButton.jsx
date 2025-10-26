import React, { useState } from 'react';
import { motion } from 'framer-motion';

const ReactionButton = ({ onReactionClick, className = "" }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onReactionClick}
      className={`absolute top-1 right-2 text-gray-400 hover:text-yellow-500 cursor-pointer transition-colors z-10 ${className}`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <motion.span
        animate={{ 
          scale: isHovered ? 1.2 : 1,
          rotate: isHovered ? [0, -10, 10, 0] : 0
        }}
        transition={{ duration: 0.2 }}
        className="text-lg"
      >
        😃
      </motion.span>
    </motion.button>
  );
};

export default ReactionButton;
