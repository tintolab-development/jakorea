import type { ReactNode } from 'react'
import type { InstructorAvailableScheduleSlot } from '@/features/program/general/lib/instructor-application-available-schedule'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'

export type { InstructorAvailableScheduleSlot }

/** 강사 신청 폼 — 커스텀 가로표 본문 옵션 */
export type ProgramApplicationFormInstructorBodyOptions = {
  enabled: boolean
  /** 승인된 기관 희망 일정 (프로그램 상세 연동) */
  scheduleSlots?: readonly InstructorAvailableScheduleSlot[]
  /** 프로그램 상세 양식 수정·미리보기 — 등록·모집 설정 연동 일정 UI */
  programLinkedPreview?: boolean
  /** authoring(user preview 아님)일 때 템플릿 안내 문구 렌더링에 사용 */
  isTemplateAuthoringMode?: boolean
  /** 프로그램 상세 신청 정보 탭 — 읽기 전용 미리보기 */
  readOnlyPreview?: boolean
}
import { PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS } from '@/features/template/model/program-application-form-instructor-draft'
import { InstructorAvailableScheduleParagraph } from '@/features/template/ui/form-set/application-form/instructor/paragraphs/instructor-available-schedule-paragraph'
import { InstructorCrimeRecordParagraph } from '@/features/template/ui/form-set/application-form/instructor/paragraphs/instructor-crime-record-paragraph'

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
          readOnlyPreview={options.readOnlyPreview === true}
        />
      )
    case PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.availableSchedule:
      return (
        <InstructorAvailableScheduleParagraph
          scheduleSlots={options.scheduleSlots}
          isTemplateAuthoringMode={options.isTemplateAuthoringMode === true}
          readOnlyPreview={options.readOnlyPreview === true}
        />
      )
    default:
      return null
  }
}
