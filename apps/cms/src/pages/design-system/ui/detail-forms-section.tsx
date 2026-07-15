import { useState } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { DetailInfoFormMode } from '@/shared/components/detail-info-form'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsInput } from '@/shared/ui/cms-input'
import { DsDemo, DsSection } from './section'

export function DetailFormsSection() {
  const [mode, setMode] = useState<DetailInfoFormMode>('view')
  const [name, setName] = useState('홍길동')
  const [email, setEmail] = useState('hong@example.com')
  const [memo, setMemo] = useState('상세 폼 데모')

  return (
    <DsSection
      id="detail-forms"
      title="Detail Forms"
      description="상세·회원 정보 등에서 쓰는 DetailInfoForm(Root / Row / Field) 격자 패턴입니다."
    >
      <p className="ds-note">
        <code>mode=&quot;view&quot; | &quot;edit&quot;</code>는 Root에 두고 Field의 <code>view</code>/
        <code>edit</code> 슬롯이 전환됩니다. 상위에 이미 제목이 있으면 <code>hideHeader</code>를
        사용합니다.
      </p>

      <DsDemo label="view / edit">
        <div className="ds-demo__row" style={{ marginBottom: 12 }}>
          <CmsButton
            variant={mode === 'view' ? 'primary' : 'secondary'}
            size="medium"
            onClick={() => setMode('view')}
          >
            view
          </CmsButton>
          <CmsButton
            variant={mode === 'edit' ? 'primary' : 'secondary'}
            size="medium"
            onClick={() => setMode('edit')}
          >
            edit
          </CmsButton>
        </div>

        <DetailInfoForm
          title="기본 정보"
          mode={mode}
          headerNote={<span style={{ color: 'var(--color-brand-primary)' }}>데모</span>}
          titleTrailing={
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>sample</span>
          }
        >
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="이름"
              required
              view={name}
              edit={
                <CmsInput value={name} onChange={e => setName(e.target.value)} width="100%" />
              }
            />
            <DetailInfoForm.Field
              label="이메일"
              view={email}
              edit={
                <CmsInput value={email} onChange={e => setEmail(e.target.value)} width="100%" />
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="메모"
              fullRow
              view={memo}
              edit={
                <CmsInput value={memo} onChange={e => setMemo(e.target.value)} width="100%" />
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="식별자"
              readOnlyDisplay
              view="demo-user-001"
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </DsDemo>
    </DsSection>
  )
}
