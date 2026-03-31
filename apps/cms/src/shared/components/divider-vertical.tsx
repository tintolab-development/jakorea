import React from 'react'
import './divider-vertical.css'

interface DividerVerticalProps {
  className?: string
  height?: number
}

export const DividerVertical: React.FC<DividerVerticalProps> = ({
  className = '',
  height = 60,
}) => {
  return <div className={`app-divider-vertical ${className}`.trim()} style={{ height: height }} />
}
