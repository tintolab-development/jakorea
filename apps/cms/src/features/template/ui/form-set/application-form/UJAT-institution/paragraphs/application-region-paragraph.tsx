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
  choiceDisplayOnly = false,
}: {
  readOnlyPreview?: boolean
  /** 프로그램 등록 — disabled 스킨 없이 미선택·입력 불가 */
  choiceDisplayOnly?: boolean
}) {
  const { labels: regionOptions } = useUjatEducationRegions()
  const [region, setRegion] = useUjatApplicationInstitutionOverlayKv<string>(
    UJAT_APPLICATION_INSTITUTION_OVERLAY_KEYS.applicationRegion,
    ''
  )

  const controlDisabled = readOnlyPreview && !choiceDisplayOnly
  const displayValue = choiceDisplayOnly ? undefined : region || undefined

  return (
    <div
      className="multiple-choice-body"
      style={choiceDisplayOnly ? { pointerEvents: 'none' } : undefined}
    >
      <CmsRadioGroup
        className="multiple-choice-radio-group multiple-choice-radio-group--inline-wrap"
        size="large"
        disabled={controlDisabled}
        value={displayValue}
        onChange={e => {
          if (choiceDisplayOnly || readOnlyPreview) return
          setRegion(e.target.value)
        }}
      >
        {regionOptions.map(option => (
          <div key={option} role="presentation" className="multiple-choice-row">
            <CmsRadio value={option} disabled={controlDisabled} />
            <span className="multiple-choice-row__label">{option}</span>
          </div>
        ))}
      </CmsRadioGroup>
    </div>
  )
}
