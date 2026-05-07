import { InstructorAvailableScheduleParagraph } from '@/features/template/ui/form-set/program-application-form-instructor/paragraphs/instructor-available-schedule-paragraph'

/** 봉사자 신청 폼 — 면접 진행 가능 일정(강사 신청 폼 일정 UI/로직 재사용) */
export function VolunteerInterviewAvailableScheduleParagraph({
  isTemplateAuthoringMode = false,
}: {
  isTemplateAuthoringMode?: boolean
}) {
  return (
    <InstructorAvailableScheduleParagraph
      isTemplateAuthoringMode={isTemplateAuthoringMode}
      summaryFieldLabel="면접 진행 가능일"
    />
  )
}
