/**
 * Detail Page Skeleton Component
 * 상세 페이지 로딩 상태용 스켈레톤 UI
 */

import MdSkeleton from './MdSkeleton'
import MdCard from './MdCard'
import './DetailPageSkeleton.css'

interface DetailPageSkeletonProps {
  sections?: number
  fieldsPerSection?: number
}

export default function DetailPageSkeleton({
  sections = 3,
  fieldsPerSection = 4,
}: DetailPageSkeletonProps) {
  return (
    <div className="detail-page-skeleton">
      {/* 헤더 영역 */}
      <div className="skeleton-header">
        <MdSkeleton variant="rectangular" height="40px" width="80px" />
        <div className="skeleton-header-actions">
          <MdSkeleton variant="rectangular" height="40px" width="70px" />
          <MdSkeleton variant="rectangular" height="40px" width="70px" />
        </div>
      </div>

      {/* 제목 및 상태 영역 */}
      <div className="skeleton-title-section">
        <MdSkeleton variant="text" height="32px" width="60%" />
        <div className="skeleton-chips">
          <MdSkeleton variant="rectangular" height="32px" width="80px" />
          <MdSkeleton variant="rectangular" height="32px" width="80px" />
        </div>
      </div>

      {/* 섹션 카드들 */}
      {Array.from({ length: sections }).map((_, sectionIndex) => (
        <MdCard key={sectionIndex} variant="elevated" className="skeleton-section-card">
          <div className="skeleton-section-header">
            <MdSkeleton variant="text" height="24px" width="150px" />
          </div>
          <div className="skeleton-fields">
            {Array.from({ length: fieldsPerSection }).map((_, fieldIndex) => (
              <div key={fieldIndex} className="skeleton-field">
                <MdSkeleton variant="text" height="20px" width="120px" />
                <MdSkeleton variant="text" height="20px" width="200px" />
              </div>
            ))}
          </div>
        </MdCard>
      ))}
    </div>
  )
}


