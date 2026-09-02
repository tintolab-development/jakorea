import { useGeneralApplicationOverlayKv } from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import '@/features/template/ui/paragraph/single-item/multiple-choice.css'

const EDUCATION_EXPERIENCE_OPTIONS = [
  { value: 'yes', label: '네, 진행했었습니다.' },
  { value: 'no', label: '아니요, 진행하지 않았습니다.' },
] as const

/** 1사1교 프로그램 참여자 신청 폼 — 전년도 1사1교 경제금융교육 진행 여부 */
export function EconomyProgramApplicationEducationExperienceParagraph() {
  const [value, setValue] = useGeneralApplicationOverlayKv<string>(
    'application.economy.previousYearParticipation',
    ''
  )

  return (
    <div className="program-registration-paragraph">
      <div className="multiple-choice-body">
        <CmsRadioGroup
          className="multiple-choice-radio-group"
          value={value === '' ? undefined : value}
          onChange={event => setValue(event.target.value)}
        >
          {EDUCATION_EXPERIENCE_OPTIONS.map(option => (
            <div key={option.value} className="multiple-choice-row">
              <CmsRadio value={option.value} />
              <span className="multiple-choice-row__label">{option.label}</span>
            </div>
          ))}
        </CmsRadioGroup>
      </div>
    </div>
  )
}
