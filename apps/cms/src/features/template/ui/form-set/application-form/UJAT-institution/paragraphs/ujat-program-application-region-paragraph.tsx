import { useState } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'

const REGION_OPTIONS = ['서울', '경기(남부)', '인천', '대전', '대구', '부산', '광주', '전북(전주)'] as const

/** UJAT 프로그램 학교 신청 폼 — 신청 지역 */
export function UjatProgramApplicationRegionParagraph() {
  const [region, setRegion] = useState<string>(REGION_OPTIONS[0])

  return (
    <DetailInfoForm title="신청 지역" hideHeader mode="edit">
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="신청 지역"
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
