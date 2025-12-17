/**
 * Material Design 3 Skeleton Component
 * M3 디자인 언어에 맞춘 스켈레톤 UI
 * M3에 공식 스켈레톤이 없으므로 디자인 언어를 고려하여 구현
 */

import './MdSkeleton.css'

interface MdSkeletonProps {
  width?: string | number
  height?: string | number
  variant?: 'text' | 'rectangular' | 'circular'
  className?: string
}

export default function MdSkeleton({
  width,
  height,
  variant = 'rectangular',
  className = '',
}: MdSkeletonProps) {
  const style: React.CSSProperties = {
    width: width || '100%',
    height: height || variant === 'text' ? '16px' : variant === 'circular' ? width || '40px' : '40px',
    borderRadius:
      variant === 'circular' ? '50%' : variant === 'text' ? '4px' : '8px',
    backgroundColor: 'var(--md-sys-color-surface-container-highest, #e6e1e5)',
    position: 'relative',
    overflow: 'hidden',
  }

  return (
    <div
      className={`md-skeleton ${className}`}
      style={style}
      role="status"
      aria-label="로딩 중"
    >
      <div className="md-skeleton-shimmer" />
    </div>
  )
}

