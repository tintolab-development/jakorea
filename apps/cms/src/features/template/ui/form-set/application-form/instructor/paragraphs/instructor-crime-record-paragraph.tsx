import '@/features/template/ui/form-set/application-form/instructor/program-application-form-instructor.css'
import '@/features/template/ui/form-editor/form-editor.css'
import {
  INSTRUCTOR_CRIME_RECORD_CONFIRM_LABEL,
  INSTRUCTOR_CRIME_RECORD_GUIDE_CAUTION,
  INSTRUCTOR_CRIME_RECORD_GUIDE_INTRO,
  INSTRUCTOR_CRIME_RECORD_GUIDE_ITEMS,
} from '@jakorea/form-schema/program-application'
import { useInstructorApplicationField } from '@/features/template/ui/form-set/application-form/instructor/instructor-application-form-rhf'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'

const CONFIRMED_VALUE = 'confirmed'

/** 성범죄경력 조회 동의서 제출 방법 안내 — 고정 본문 + 확인 라디오 */
export function InstructorCrimeRecordParagraph({
  isTemplateAuthoringMode = false,
  readOnlyPreview = false,
}: {
  isTemplateAuthoringMode?: boolean
  readOnlyPreview?: boolean
}) {
  const [confirmed, setConfirmed] = useInstructorApplicationField<boolean>(
    'application.instructor.crimeRecordConfirmed',
    false
  )
  const displayOnly = isTemplateAuthoringMode || readOnlyPreview

  return (
    <div className="form-editor-body program-application-form-instructor__crime-guide">
      <div className="program-application-form-instructor__crime-guide-body">
        <p>{INSTRUCTOR_CRIME_RECORD_GUIDE_INTRO}</p>
        <ul className="program-application-form-instructor__crime-guide-list">
          {INSTRUCTOR_CRIME_RECORD_GUIDE_ITEMS.map(item => (
            <li key={item.title}>
              <p>{item.title}</p>
              <p>{item.body}</p>
            </li>
          ))}
        </ul>
        <p>{INSTRUCTOR_CRIME_RECORD_GUIDE_CAUTION}</p>
      </div>
      <CmsRadioGroup
        className={[
          'program-application-form-instructor__crime-guide-confirm',
          displayOnly && 'program-application-form-instructor__crime-guide-confirm--display-only',
        ]
          .filter(Boolean)
          .join(' ')}
        size="medium"
        value={!displayOnly && confirmed ? CONFIRMED_VALUE : undefined}
        onChange={e => {
          if (displayOnly) return
          setConfirmed(e.target.value === CONFIRMED_VALUE)
        }}
      >
        <CmsRadio value={CONFIRMED_VALUE}>{INSTRUCTOR_CRIME_RECORD_CONFIRM_LABEL}</CmsRadio>
      </CmsRadioGroup>
    </div>
  )
}
