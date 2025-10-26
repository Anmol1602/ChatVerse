import { motion } from 'framer-motion'
import { forwardRef } from 'react'

const AnimatedCard = forwardRef(({ 
  children, 
  className = '',
  hover = true,
  ...props 
}, ref) => {
  return (
    <motion.div
      ref={ref}
      className={`
        bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hover ? { 
        y: -2, 
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
      } : {}}
      {...props}
    >
      {children}
    </motion.div>
  )
})

AnimatedCard.displayName = 'AnimatedCard'

export default AnimatedCard
