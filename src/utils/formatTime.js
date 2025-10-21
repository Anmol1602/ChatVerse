export const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInHours = (now - date) / (1000 * 60 * 60)

  if (diffInHours < 24) {
    // Show time if today
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  } else if (diffInHours < 48) {
    // Show "Yesterday"
    return 'Yesterday'
  } else if (diffInHours < 168) {
    // Show day of week if within a week
    return date.toLocaleDateString([], { weekday: 'short' })
  } else {
    // Show date if older than a week
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric' 
    })
  }
}

export const formatFullTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const isToday = (timestamp) => {
  const date = new Date(timestamp)
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

export const isYesterday = (timestamp) => {
  const date = new Date(timestamp)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return date.toDateString() === yesterday.toDateString()
}
