import React from 'react'

const AdminBadge = ({ className = "" }) => {
  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-bold text-white bg-blue-500 rounded-full ${className}`}>
      Admin
    </span>
  )
}

export default AdminBadge
