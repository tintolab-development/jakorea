import { useState } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'

import { UJAT_VOLUNTEER_PREFERRED_REGIONS } from '@/features/program/model/ujat-volunteer-screening-constants'

const REGION_OPTIONS = UJAT_VOLUNTEER_PREFERRED_REGIONS

/** UJAT 프로그램 봉사자 신청 폼 — 희망 교육 활동 지역 */
export function UjatProgramApplicationVolunteerPreferredRegionParagraph() {
  const [region, setRegion] = useState<string>(REGION_OPTIONS[0])

  return (
    <DetailInfoForm title="희망 교육 활동 지역" hideHeader mode="edit">
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="희망 활동 지역"
          fullRow
          edit={
            <CmsRadioGroup
              size="large"
              value={region}
              onChange={e => setRegion(e.target.value)}
              style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}
            >
              {REGION_OPTIONS.map(option => (
                <CmsRadio key={option} value={option}>
                  {option}
                </CmsRadio>
              ))}
            </CmsRadioGroup>
          }
          view="-"
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
