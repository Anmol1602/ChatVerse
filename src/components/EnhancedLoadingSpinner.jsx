import { motion } from 'framer-motion'

const EnhancedLoadingSpinner = ({ size = 'md', className = '' }) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4'
      case 'md':
        return 'w-8 h-8'
      case 'lg':
        return 'w-12 h-12'
      case 'xl':
        return 'w-16 h-16'
      default:
        return 'w-8 h-8'
    }
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        className={`${getSizeClasses()} border-4 border-gray-200 dark:border-gray-700 border-t-primary-500 rounded-full`}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
    </div>
  )
}

export default EnhancedLoadingSpinner
