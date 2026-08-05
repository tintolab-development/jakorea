import { CmsButton } from '@/shared/ui'
import { DsDemo, DsSection } from './section'

export function ListLayoutSection() {
  return (
    <DsSection
      id="list-layout"
      title="List layout"
      description="목록 카드·툴바 갭은 CMS FilterTableLayout 미러 토큰을 사용합니다."
    >
      <p className="ds-note">
        토큰: <code>--admin-list-card-padding: 20px</code> ·{' '}
        <code>--admin-list-toolbar-to-table-gap: 16px</code> ·{' '}
        <code>--admin-list-title-desc-gap: 10px</code> ·{' '}
        <code>--admin-list-toolbar-actions-gap: 8px</code>
        <br />
        Rule: <code>apps/admin/.cursor/rules/design/list-table-spacing.mdc</code>
      </p>

      <DsDemo label="admin-list-card + toolbar">
        <div className="admin-list-card" style={{ marginBottom: 0 }}>
          <div className="admin-list-toolbar">
            <div className="table-header-title--wrapper">
              <span className="table-title">히어로 배너 목록</span>
              <span className="table-description">총 6건</span>
            </div>
            <div className="table-header-actions--wrapper">
              <CmsButton variant="delete" size="medium">
                선택 삭제
              </CmsButton>
              <CmsButton variant="primary" size="medium">
                배너 등록
              </CmsButton>
            </div>
          </div>
          <p className="ds-demo__hint">여기부터 테이블 영역 (툴바↔테이블 갭 16px)</p>
        </div>
      </DsDemo>
    </DsSection>
  )
}
