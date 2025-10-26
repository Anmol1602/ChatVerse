import { motion } from 'framer-motion'

const DateSeparator = ({ date }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    // Check if it's today
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    }
    
    // Check if it's yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    }
    
    // Format as "Month Day, Year"
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex justify-center my-4"
    >
      <div className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-full px-3 py-1">
        {formatDate(date)}
      </div>
    </motion.div>
  )
}

export default DateSeparator
