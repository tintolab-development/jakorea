import '@/features/template/ui/form-editor/form-editor.css'
import './program-application-schedule-template-hint-paragraph.css'

export const PROGRAM_APPLICATION_SCHEDULE_TEMPLATE_DEFAULT_HINT =
  '프로그램 등록 / 모집 폼의 설정값에 따라 상이'

type ProgramApplicationScheduleTemplateHintParagraphProps = {
  /** 미지정 시 `PROGRAM_APPLICATION_SCHEDULE_TEMPLATE_DEFAULT_HINT` */
  hintText?: string
  /**
   * true: 캘린더 옆 열(`.program-application-form-instructor__schedule-side`) 안에서
   * 캘린더 높이에 맞춰 영역을 채움. false: 단독 블록(기본 min-height 200px).
   */
  fillScheduleSide?: boolean
}

/** 프로그램 참여자 신청(개인/학교) 등 템플릿 편집용 공통 안내 박스 */
export function ProgramApplicationScheduleTemplateHintParagraph({
  hintText = PROGRAM_APPLICATION_SCHEDULE_TEMPLATE_DEFAULT_HINT,
  fillScheduleSide = false,
}: ProgramApplicationScheduleTemplateHintParagraphProps) {
  return (
    <div
      className={[
        'program-application-schedule-template-hint',
        fillScheduleSide ? 'program-application-schedule-template-hint--fillScheduleSide' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="form-editor-template-field-hint-text">{hintText}</span>
    </div>
  )
}
