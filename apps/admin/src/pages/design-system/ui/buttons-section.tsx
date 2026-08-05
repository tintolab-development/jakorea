import { useState } from 'react'
import { CmsButton } from '@/shared/ui'
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
        <strong>Size</strong> — large 140×44 · medium 120×40 · small 100×32.
        <br />
        <strong>Variant</strong> — primary · secondary(민트 아웃라인) · default · delete.
        <br />
        <strong>용도</strong> — 목록 툴바 액션=medium · 모달 푸터=medium · FileSelectField 버튼=medium
        secondary.
      </p>

      <DsDemo label="CmsButton variants (medium)">
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
            Large
          </CmsButton>
          <CmsButton variant="secondary" size="medium">
            Medium
          </CmsButton>
          <CmsButton variant="secondary" size="small">
            Small
          </CmsButton>
        </div>
      </DsDemo>

      <DsDemo label="Loading">
        <div className="ds-demo__row">
          <CmsButton
            variant="primary"
            size="medium"
            loading={loading}
            onClick={() => {
              setLoading(true)
              window.setTimeout(() => setLoading(false), 1200)
            }}
          >
            클릭
          </CmsButton>
        </div>
      </DsDemo>
    </DsSection>
  )
}
