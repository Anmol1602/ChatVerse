import { motion } from 'framer-motion'

const LoadingDots = ({ size = 'sm', color = 'primary' }) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return 'w-1 h-1'
      case 'sm':
        return 'w-2 h-2'
      case 'md':
        return 'w-3 h-3'
      case 'lg':
        return 'w-4 h-4'
      default:
        return 'w-2 h-2'
    }
  }

  const getColorClasses = () => {
    switch (color) {
      case 'primary':
        return 'bg-primary-600'
      case 'white':
        return 'bg-white'
      case 'gray':
        return 'bg-gray-400'
      default:
        return 'bg-primary-600'
    }
  }

  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={`${getSizeClasses()} ${getColorClasses()} rounded-full`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: index * 0.2
          }}
        />
      ))}
    </div>
  )
}

export default LoadingDots
