/**
 * Card Grid Skeleton Component
 * 카드 그리드 레이아웃 로딩 상태용 스켈레톤 UI
 */

import MdSkeleton from './MdSkeleton'
import MdCard from './MdCard'
import './CardGridSkeleton.css'

interface CardGridSkeletonProps {
  cards?: number
}

export default function CardGridSkeleton({ cards = 6 }: CardGridSkeletonProps) {
  return (
    <div className="card-grid-skeleton">
      {Array.from({ length: cards }).map((_, index) => (
        <MdCard key={index} variant="elevated" className="skeleton-card">
          <div className="skeleton-card-content">
            {/* 제목 */}
            <MdSkeleton variant="text" height="24px" width="60%" />
            {/* 설명 줄 1 */}
            <MdSkeleton variant="text" height="16px" width="100%" />
            {/* 설명 줄 2 */}
            <MdSkeleton variant="text" height="16px" width="80%" />
            {/* 메타 정보 영역 */}
            <div className="skeleton-card-meta">
              <MdSkeleton variant="text" height="14px" width="100px" />
              <MdSkeleton variant="rectangular" height="24px" width="60px" />
            </div>
            {/* 하단 버튼 영역 */}
            <div className="skeleton-card-actions">
              <MdSkeleton variant="rectangular" height="36px" width="80px" />
            </div>
          </div>
        </MdCard>
      ))}
    </div>
  )
}


