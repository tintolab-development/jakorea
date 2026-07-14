import { Spin } from 'antd'
import { EmptyState } from '@/shared/ui/empty-state'
import { DsDemo, DsSection } from './section'

export function FeedbackSection() {
  return (
    <DsSection
      id="feedback"
      title="Empty & Loading"
      description="빈 목록은 EmptyState, 상세/페이지 로딩은 page-content-loading + Spin입니다. 로딩 전에 empty를 먼저 보여주지 마세요."
    >
      <p className="ds-note">
        올바른 순서: <code>isLoading</code> → Spin → 로드 완료 후 <code>!data</code>일 때만 Empty /
        not-found.
      </p>

      <DsDemo label="EmptyState">
        <EmptyState
          description="검색 결과가 없습니다."
          cta={{ label: '필터 초기화', onClick: () => undefined }}
        />
      </DsDemo>

      <DsDemo label="page-content-loading (인라인)">
        <div className="page-content-loading ds-loading-demo" role="status" aria-label="로딩 중">
          <Spin size="large" />
        </div>
      </DsDemo>

      <DsDemo label="page-content-loading--viewport (페이지 단위)">
        <div
          className="page-content-loading page-content-loading--viewport ds-loading-demo"
          role="status"
          aria-label="페이지 로딩 중"
          style={{ position: 'relative', minHeight: 200 }}
        >
          <Spin size="large" />
        </div>
      </DsDemo>
    </DsSection>
  )
}
