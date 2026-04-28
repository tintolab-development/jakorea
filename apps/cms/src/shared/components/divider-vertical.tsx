import React from 'react'
import './divider-vertical.css'

interface DividerVerticalProps {
  className?: string
  /** 생략 시 CSS 기본(13px) */
  height?: number
}

export const DividerVertical: React.FC<DividerVerticalProps> = ({ className = '', height }) => {
  return (
    <div
      className={`app-divider-vertical ${className}`.trim()}
      style={height !== undefined ? { height } : undefined}
    />
  )
}
