import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { useUjatEducationRegions } from '@/features/program/ujat/hooks/use-ujat-education-regions'
import {
  UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS,
  useUjatApplicationVolunteerOverlayKv,
} from '@/features/template/ui/form-set/application-form/UJAT-volunteer/ujat-application-volunteer-overlay-sync'
import '@/features/template/ui/paragraph/single-item/multiple-choice.css'
import '@/features/template/ui/form-set/application-form/UJAT-institution/paragraphs/application-region-paragraph.css'
import { useIsTemplateManagementScreen } from '@/features/template/ui/template-management/detail-view-mode-context'

/** UJAT 프로그램 봉사자 신청 폼 — 희망 교육 활동 지역 (객관식형 가로 라디오) */
export function UjatProgramApplicationVolunteerPreferredRegionParagraph() {
  /** 템플릿 관리 시안(12875:515697) — 지역 라디오 가로 간격 16 */
  const isTemplateManagementScreen = useIsTemplateManagementScreen()
  const { regions } = useUjatEducationRegions()
  const [region, setRegion] = useUjatApplicationVolunteerOverlayKv<string>(
    UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.preferredRegion,
    ''
  )
  const selectedRegion = regions.find(
    option =>
      option.key === region ||
      option.key.toLowerCase() === region.trim().toLowerCase() ||
      option.label === region
  )?.key

  return (
    <div className="multiple-choice-body">
      <CmsRadioGroup
        className={[
          'multiple-choice-radio-group multiple-choice-radio-group--inline-wrap',
          isTemplateManagementScreen && 'multiple-choice-radio-group--inline-wrap-spec',
        ]
          .filter(Boolean)
          .join(' ')}
        size="medium"
        value={selectedRegion || undefined}
        onChange={e => setRegion(e.target.value)}
      >
        {regions.map(option => (
          <div key={option.key} role="presentation" className="multiple-choice-row">
            <CmsRadio value={option.key} />
            <span className="multiple-choice-row__label">{option.label}</span>
          </div>
        ))}
      </CmsRadioGroup>
    </div>
  )
}
