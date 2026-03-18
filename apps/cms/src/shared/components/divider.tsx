import React from 'react'
import './divider.css'

interface DividerProps {
  className?: string
}

export const Divider: React.FC<DividerProps> = ({ className = '' }) => {
  return <div className={`app-divider ${className}`.trim()} />
}
