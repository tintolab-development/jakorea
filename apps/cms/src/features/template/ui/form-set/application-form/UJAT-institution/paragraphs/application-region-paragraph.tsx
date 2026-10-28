import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { useUjatEducationRegions } from '@/features/program/ujat/hooks/use-ujat-education-regions'
import {
  UJAT_APPLICATION_INSTITUTION_OVERLAY_KEYS,
  useUjatApplicationInstitutionOverlayKv,
} from '@/features/template/ui/form-set/application-form/UJAT-institution/ujat-application-institution-overlay-sync'
import '@/features/template/ui/paragraph/single-item/multiple-choice.css'
import './application-region-paragraph.css'

/** UJAT 프로그램 학교 신청 폼 — 신청 지역 (교육 지역 관리 remote 사용 항목) */
export function UjatProgramApplicationApplicationRegionParagraph({
  readOnlyPreview = false,
  choiceDisplayOnly = false,
  fallbackLabels = [],
}: {
  readOnlyPreview?: boolean
  /** 프로그램 등록 — disabled 스킨 없이 미선택·입력 불가 */
  choiceDisplayOnly?: boolean
  fallbackLabels?: readonly string[]
}) {
  const { labels: remoteLabels } = useUjatEducationRegions()
  const regionOptions = remoteLabels.length > 0 ? remoteLabels : fallbackLabels
  const [region, setRegion] = useUjatApplicationInstitutionOverlayKv<string>(
    UJAT_APPLICATION_INSTITUTION_OVERLAY_KEYS.applicationRegion,
    ''
  )

  const interactive = !readOnlyPreview && !choiceDisplayOnly
  const displayValue = choiceDisplayOnly ? undefined : region || undefined

  return (
    <div
      className={[
        'multiple-choice-body',
        'application-region-paragraph',
        !interactive ? 'application-region-paragraph--display-only' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <CmsRadioGroup
        className="application-region-paragraph__group"
        size="medium"
        value={displayValue}
        onChange={e => {
          if (!interactive) return
          setRegion(e.target.value)
        }}
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
