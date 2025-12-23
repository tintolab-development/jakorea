/**
 * List Skeleton Component
 * 리스트 레이아웃 로딩 상태용 스켈레톤 UI
 */

import MdSkeleton from './MdSkeleton'
import MdCard from './MdCard'
import './ListSkeleton.css'

interface ListSkeletonProps {
  items?: number
}

export default function ListSkeleton({ items = 8 }: ListSkeletonProps) {
  return (
    <div className="list-skeleton">
      {Array.from({ length: items }).map((_, index) => (
        <MdCard key={index} variant="outlined" className="skeleton-list-item">
          <div className="skeleton-list-content">
            {/* 아이콘/이미지 영역 (선택적) */}
            <div className="skeleton-list-icon">
              <MdSkeleton variant="circular" width="48px" height="48px" />
            </div>
            {/* 텍스트 영역 */}
            <div className="skeleton-list-text">
              {/* 제목 */}
              <MdSkeleton variant="text" height="20px" width="40%" />
              {/* 설명 줄 1 */}
              <MdSkeleton variant="text" height="16px" width="80%" />
              {/* 설명 줄 2 */}
              <MdSkeleton variant="text" height="16px" width="60%" />
            </div>
            {/* 메타 정보 영역 */}
            <div className="skeleton-list-meta">
              <MdSkeleton variant="text" height="14px" width="100px" />
              <MdSkeleton variant="rectangular" height="32px" width="70px" />
            </div>
          </div>
        </MdCard>
      ))}
    </div>
  )
}






