import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { useUjatEducationRegions } from '@/features/program/ujat/hooks/use-ujat-education-regions'
import {
  UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS,
  useUjatApplicationVolunteerOverlayKv,
} from '@/features/template/ui/form-set/application-form/UJAT-volunteer/ujat-application-volunteer-overlay-sync'
import '@/features/template/ui/paragraph/single-item/multiple-choice.css'

/** UJAT 프로그램 봉사자 신청 폼 — 희망 교육 활동 지역 (객관식형 가로 라디오) */
export function UjatProgramApplicationVolunteerPreferredRegionParagraph() {
  const { labels: regionOptions } = useUjatEducationRegions()
  const [region, setRegion] = useUjatApplicationVolunteerOverlayKv<string>(
    UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.preferredRegion,
    ''
  )

  return (
    <div className="multiple-choice-body">
      <CmsRadioGroup
        className="multiple-choice-radio-group multiple-choice-radio-group--inline-wrap"
        size="large"
        value={region || undefined}
        onChange={e => setRegion(e.target.value)}
      >
        {regionOptions.map(option => (
          <div key={option} role="presentation" className="multiple-choice-row">
            <CmsRadio value={option} />
            <span className="multiple-choice-row__label">{option}</span>
          </div>
        ))}
      </CmsRadioGroup>
    </div>
  )
}
