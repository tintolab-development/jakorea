import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import {
  UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS,
  useUjatApplicationVolunteerOverlayKv,
} from '@/features/template/ui/form-set/application-form/UJAT-volunteer/ujat-application-volunteer-overlay-sync'
import '@/features/template/ui/paragraph/single-item/multiple-choice.css'

/** UJAT 프로그램 봉사자 신청 폼 — 교육 진행 경험 여부 (객관식형 가로 라디오) */
export function UjatProgramApplicationVolunteerEducationExperienceParagraph() {
  const [hasExperience, setHasExperience] = useUjatApplicationVolunteerOverlayKv<
    'no' | 'yes' | undefined
  >(UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.hasExperience, undefined)

  return (
    <div className="multiple-choice-body">
      <CmsRadioGroup
        className="multiple-choice-radio-group multiple-choice-radio-group--inline"
        size="large"
        value={hasExperience}
        onChange={e => setHasExperience(e.target.value as 'no' | 'yes')}
      >
        <div role="presentation" className="multiple-choice-row">
          <CmsRadio value="yes" />
          <span className="multiple-choice-row__label">있음</span>
        </div>
        <div role="presentation" className="multiple-choice-row">
          <CmsRadio value="no" />
          <span className="multiple-choice-row__label">없음</span>
        </div>
      </CmsRadioGroup>
    </div>
  )
}
