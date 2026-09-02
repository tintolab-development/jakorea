import { useEffect } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { useUjatEducationRegions } from '@/features/program/ujat/hooks/use-ujat-education-regions'
import {
  getGeneralApplicationOverlayRecord,
  useGeneralApplicationOverlayKv,
} from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'

/** UJAT 프로그램 학교 신청 폼 — 신청 지역 */
export function UjatProgramApplicationRegionParagraph() {
  const { regions: regionOptions } = useUjatEducationRegions()
  const [region, setRegion] = useGeneralApplicationOverlayKv<string>(
    'application.ujat.inst.region',
    ''
  )

  useEffect(() => {
    if (regionOptions.length === 0) return
    const current = (getGeneralApplicationOverlayRecord()['application.ujat.inst.region'] as
      | string
      | undefined) ?? ''
    const valid = regionOptions.some(r => r.label === current)
    if (!valid) {
      setRegion(regionOptions[0]!.label)
    }
  }, [regionOptions, setRegion])

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
              {regionOptions.map(option => (
                <CmsRadio key={option.key} value={option.label}>
                  {option.label}
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
