import { useState } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'

/** UJAT 프로그램 봉사자 신청 폼 — 교육 진행 경험 여부 */
export function UjatProgramApplicationVolunteerEducationExperienceParagraph() {
  const [hasExperience, setHasExperience] = useState<'no' | 'yes' | undefined>(undefined)

  return (
    <DetailInfoForm title="교육 진행 경험 여부" hideHeader mode="edit">
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="교육 진행 경험"
          fullRow
          edit={
            <CmsRadioGroup
              size="large"
              value={hasExperience}
              onChange={e => setHasExperience(e.target.value as 'no' | 'yes')}
              style={{ display: 'flex', gap: 20 }}
            >
              <CmsRadio value="yes">있음</CmsRadio>
              <CmsRadio value="no">없음</CmsRadio>
            </CmsRadioGroup>
          }
          view="-"
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
