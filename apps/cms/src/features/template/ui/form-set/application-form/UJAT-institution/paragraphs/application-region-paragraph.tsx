import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { useUjatEducationRegions } from '@/features/program/ujat/hooks/use-ujat-education-regions'
import {
  UJAT_APPLICATION_INSTITUTION_OVERLAY_KEYS,
  useUjatApplicationInstitutionOverlayKv,
} from '@/features/template/ui/form-set/application-form/UJAT-institution/ujat-application-institution-overlay-sync'
import '@/features/template/ui/paragraph/single-item/multiple-choice.css'

/** UJAT 프로그램 학교 신청 폼 — 신청 지역 (교육 지역 관리 사용 항목) */
export function UjatProgramApplicationApplicationRegionParagraph({
  readOnlyPreview = false,
}: {
  readOnlyPreview?: boolean
}) {
  const { labels: regionOptions } = useUjatEducationRegions()
  const [region, setRegion] = useUjatApplicationInstitutionOverlayKv<string>(
    UJAT_APPLICATION_INSTITUTION_OVERLAY_KEYS.applicationRegion,
    ''
  )

  return (
    <div className="multiple-choice-body">
      <CmsRadioGroup
        className="multiple-choice-radio-group multiple-choice-radio-group--inline-wrap"
        size="large"
        disabled={readOnlyPreview}
        value={region || undefined}
        onChange={e => setRegion(e.target.value)}
      >
        {regionOptions.map(option => (
          <div key={option} role="presentation" className="multiple-choice-row">
            <CmsRadio value={option} disabled={readOnlyPreview} />
            <span className="multiple-choice-row__label">{option}</span>
          </div>
        ))}
      </CmsRadioGroup>
    </div>
  )
}
