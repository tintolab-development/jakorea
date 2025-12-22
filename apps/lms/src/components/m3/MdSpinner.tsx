/**
 * Material Design 3 Spinner Component
 * M3 디자인 언어에 맞춘 로딩 스피너
 */

import './MdSpinner.css'

interface MdSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export default function MdSpinner({ size = 'medium', className = '' }: MdSpinnerProps) {
  const sizeMap = {
    small: '16px',
    medium: '24px',
    large: '32px',
  }

  return (
    <div
      className={`md-spinner md-spinner--${size} ${className}`}
      style={{ width: sizeMap[size], height: sizeMap[size] }}
      role="status"
      aria-label="로딩 중"
    >
      <svg
        className="md-spinner__circle"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="md-spinner__path"
          cx="12"
          cy="12"
          r="10"
          fill="none"
          strokeWidth="2"
        />
      </svg>
    </div>
  )
}






