import { useState } from 'react'
import { CmsButton, ExcelButton } from '@/shared/ui'
import { DsDemo, DsSection } from './section'

export function ButtonsSection() {
  const [loading, setLoading] = useState(false)

  return (
    <DsSection
      id="buttons"
      title="Buttons"
      description="표준 버튼은 CmsButton입니다. loading 중에는 라벨을 숨기고 스피너만 표시합니다."
    >
      <p className="ds-note">
        <strong>Size</strong> — large 140×44 · medium 120×40 · small 100×32 · large+icon 180×44.
        <br />
        <strong>Variant</strong> — primary · secondary(민트 아웃라인) · default · delete.
        <br />
        <strong>용도 (SSOT)</strong> — 목록 툴바=large · 모달 푸터=large · 엑셀=
        <code>ExcelButton</code> · FileSelectField 버튼=medium secondary. 규칙:{' '}
        <code>.cursor/rules/cms-admin-ui/cms-button-action-sizes.mdc</code>
      </p>

      <DsDemo label="용도별: 툴바·모달 푸터 large (140×44)">
        <p className="ds-demo__hint" style={{ marginTop: 0 }}>
          취소 secondary · 등록/저장 primary · 선택 삭제 delete — 모두{' '}
          <code>size=&quot;large&quot;</code>. CSS 강제: 모달{' '}
          <code>.content-modal__footer-actions</code> · 툴바{' '}
          <code>.table-header-actions--wrapper</code>
        </p>
        <div className="ds-demo__row">
          <CmsButton variant="secondary" size="large">
            취소
          </CmsButton>
          <CmsButton variant="primary" size="large">
            등록
          </CmsButton>
          <CmsButton variant="delete" size="large">
            선택 삭제
          </CmsButton>
        </div>
      </DsDemo>

      <DsDemo label="ExcelButton (large + icon 180×44)">
        <p className="ds-demo__hint" style={{ marginTop: 0 }}>
          <code>ExcelButton</code> = primary · large · Download 아이콘 · 180×44 (CMS 동일 스펙)
        </p>
        <div className="ds-demo__row">
          <ExcelButton onClick={() => undefined} />
          <ExcelButton disabled />
        </div>
      </DsDemo>

      <DsDemo label="CmsButton variants (medium — 행 액션·FileSelect 등)">
        <div className="ds-demo__row">
          <CmsButton variant="primary" size="medium">
            Primary
          </CmsButton>
          <CmsButton variant="secondary" size="medium">
            Secondary
          </CmsButton>
          <CmsButton variant="default" size="medium">
            Default
          </CmsButton>
          <CmsButton variant="delete" size="medium">
            Delete
          </CmsButton>
          <CmsButton variant="primary" size="medium" disabled>
            Disabled
          </CmsButton>
        </div>
      </DsDemo>

      <DsDemo label="CmsButton sizes">
        <div className="ds-demo__row">
          <CmsButton variant="secondary" size="large">
            Large 140×44
          </CmsButton>
          <CmsButton variant="secondary" size="medium">
            Medium 120×40
          </CmsButton>
          <CmsButton variant="secondary" size="small">
            Small 100×32
          </CmsButton>
        </div>
      </DsDemo>

      <DsDemo label="Loading">
        <div className="ds-demo__row">
          <CmsButton
            variant="primary"
            size="large"
            loading={loading}
            onClick={() => {
              setLoading(true)
              window.setTimeout(() => setLoading(false), 1200)
            }}
          >
            저장
          </CmsButton>
        </div>
      </DsDemo>
    </DsSection>
  )
}
