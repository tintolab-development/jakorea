import { useState } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput, CmsRadio, CmsRadioGroup } from '@/shared/ui'

/** 관리자 대리 작성 — 활동 시기 및 UJAT 등록 기수 */
export function UjatEducationProgressVolunteerActivityTermSection() {
  const [half, setHalf] = useState<'h1' | 'h2'>('h2')
  const [cohort, setCohort] = useState('')

  return (
    <DetailInfoForm title="활동 시기 및 UJAT 등록 기수" mode="edit">
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="활동 시기"
          required
          edit={
            <CmsRadioGroup
              size="large"
              value={half}
              onChange={e => setHalf(e.target.value as 'h1' | 'h2')}
              style={{ display: 'flex', gap: 20 }}
            >
              <CmsRadio value="h1">상반기</CmsRadio>
              <CmsRadio value="h2">하반기</CmsRadio>
            </CmsRadioGroup>
          }
          view="-"
        />
        <DetailInfoForm.Field
          label="UJAT 등록 기수"
          required
          edit={
            <CmsInput
              inputSize="medium"
              width="100%"
              placeholder="숫자만 기재"
              value={cohort}
              onChange={e => setCohort(e.target.value)}
            />
          }
          view="-"
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
