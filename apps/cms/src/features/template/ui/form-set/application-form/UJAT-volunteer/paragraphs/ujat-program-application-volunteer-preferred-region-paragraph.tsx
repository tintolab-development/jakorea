import { useEffect, useState } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { useUjatEducationRegions } from '@/features/program/ujat/hooks/use-ujat-education-regions'

/** UJAT 프로그램 봉사자 신청 폼 — 희망 교육 활동 지역 */
export function UjatProgramApplicationVolunteerPreferredRegionParagraph() {
  const { labels: regionOptions } = useUjatEducationRegions()
  const [region, setRegion] = useState('')

  useEffect(() => {
    if (regionOptions.length === 0) return
    setRegion(current => (current && regionOptions.includes(current) ? current : regionOptions[0]))
  }, [regionOptions])

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
              {regionOptions.map(option => (
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
