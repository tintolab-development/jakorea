import { useState } from 'react'
import { CmsButton } from '@/shared/ui/cms-button'
import { ExcelButton } from '@/shared/ui/excel-button'
import { DsDemo, DsSection } from './section'

export function ButtonsSection() {
  const [loading, setLoading] = useState(false)

  return (
    <DsSection
      id="buttons"
      title="Buttons"
      description="표준 버튼은 CmsButton입니다. loading 중에는 라벨을 숨기고 스피너만 표시합니다."
    >
      <p className="ds-note">신규 화면과 기존 화면 모두 CmsButton을 사용하세요.</p>

      <DsDemo label="CmsButton variants">
        <div className="ds-demo__row">
          <CmsButton variant="primary">Primary</CmsButton>
          <CmsButton variant="secondary">Secondary</CmsButton>
          <CmsButton variant="default">Default</CmsButton>
          <CmsButton variant="delete">Delete</CmsButton>
          <CmsButton variant="primary" disabled>
            Disabled
          </CmsButton>
        </div>
      </DsDemo>

      <DsDemo label="CmsButton sizes">
        <div className="ds-demo__row">
          <CmsButton variant="primary" size="large">
            Large
          </CmsButton>
          <CmsButton variant="primary" size="medium">
            Medium
          </CmsButton>
          <CmsButton variant="primary" size="small">
            Small
          </CmsButton>
        </div>
      </DsDemo>

      <DsDemo label="Loading (spinner only)">
        <div className="ds-demo__row">
          <CmsButton
            variant="primary"
            loading={loading}
            onClick={() => {
              setLoading(true)
              window.setTimeout(() => setLoading(false), 1500)
            }}
          >
            저장
          </CmsButton>
          <CmsButton variant="secondary" loading>
            조회 중
          </CmsButton>
        </div>
      </DsDemo>

      <DsDemo label="ExcelButton">
        <div className="ds-demo__row">
          <ExcelButton onClick={() => undefined} />
          <ExcelButton disabled />
        </div>
      </DsDemo>
    </DsSection>
  )
}
