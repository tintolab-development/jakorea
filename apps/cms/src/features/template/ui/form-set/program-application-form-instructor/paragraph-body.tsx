import type { ReactNode } from 'react'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'

/** 강사 신청 폼 — 커스텀 가로표 본문·불가 일자 행 추가 액션 */
export type ProgramApplicationFormInstructorBodyOptions = {
  enabled: boolean
  onAddUnavailableDateRow: () => void
  /** 템플릿(/templates) 편집 화면에서는 강의 불가 일정 추가 버튼 비활성 */
  disableUnavailableDateRowAddButton?: boolean
  /** 템플릿(/templates) 편집 화면에서는 강의 불가 일정 예시 1행만 노출 */
  authoringUnavailableDatesExampleRowOnly?: boolean
  /** authoring(user preview 아님)일 때 템플릿 안내 문구 렌더링에 사용 */
  isTemplateAuthoringMode?: boolean
}
import { PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS } from '@/features/template/model/program-application-form-instructor-draft'
import { InstructorAvailableScheduleParagraph } from '@/features/template/ui/form-set/program-application-form-instructor/paragraphs/instructor-available-schedule-paragraph'
import { InstructorCrimeRecordParagraph } from '@/features/template/ui/form-set/program-application-form-instructor/paragraphs/instructor-crime-record-paragraph'

export function renderProgramApplicationFormInstructorParagraphBody(
  paragraph: HorizontalTableParagraph,
  options: ProgramApplicationFormInstructorBodyOptions | undefined
): ReactNode | null {
  if (options?.enabled !== true) return null
  switch (paragraph.id) {
    case PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.crimeRecord:
      return (
        <InstructorCrimeRecordParagraph
          isTemplateAuthoringMode={options.isTemplateAuthoringMode === true}
        />
      )
    case PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.availableSchedule:
      return (
        <InstructorAvailableScheduleParagraph
          isTemplateAuthoringMode={options.isTemplateAuthoringMode === true}
        />
      )
    default:
      return null
  }
}
