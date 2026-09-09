import '@/features/template/ui/form-editor/form-editor.css'
import './program-application-schedule-template-hint-paragraph.css'

export const PROGRAM_APPLICATION_SCHEDULE_TEMPLATE_DEFAULT_HINT =
  '프로그램 등록 / 모집 폼의 설정값에 따라 상이'

/** 교육받은 교사 등 — 템플릿 편집·미리보기 본문 안내 */
export const PROGRAM_APPLICATION_SCHEDULE_STRUCTURE_HINT =
  '프로그램 등록 시 설정값에 따라 항목 및 구조가 다르게 노출됩니다.'

/** 강의/면접 진행 가능일 요약 칸 — 템플릿·미선택 시 안내 */
export const PROGRAM_APPLICATION_SCHEDULE_SUMMARY_HINT =
  '신청자가 선택한 진행 가능일이 노출됩니다.'

/** 강사·Gemini 강사 신청 — 템플릿 write 모드 강의 진행 가능 일정 안내 */
export const PROGRAM_APPLICATION_INSTRUCTOR_AVAILABLE_SCHEDULE_TEMPLATE_HINT =
  '기관 프로그램은 기관이 신청한 희망 일정 및 시간이 노출되며,\n개인 프로그램은 프로그램 등록 시 관리자가 설정한 일정 및 시간이 노출됩니다.'

/** @deprecated `PROGRAM_APPLICATION_INSTRUCTOR_AVAILABLE_SCHEDULE_TEMPLATE_HINT` 사용 */
export const GEMINI_INSTRUCTOR_AVAILABLE_SCHEDULE_TEMPLATE_HINT =
  PROGRAM_APPLICATION_INSTRUCTOR_AVAILABLE_SCHEDULE_TEMPLATE_HINT

/** 봉사자 신청 폼 — 면접 일정 우측 열(템플릿 작성) */
export const VOLUNTEER_INTERVIEW_APPLICANT_SCHEDULE_TEMPLATE_HINT =
  '봉사자 모집 폼에서 관리자가 설정한 일정 및 시간대가 노출됩니다.'

export function ProgramApplicationScheduleSummaryHintText() {
  return (
    <span className="form-editor-template-field-hint-text">
      {PROGRAM_APPLICATION_SCHEDULE_SUMMARY_HINT}
    </span>
  )
}

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
