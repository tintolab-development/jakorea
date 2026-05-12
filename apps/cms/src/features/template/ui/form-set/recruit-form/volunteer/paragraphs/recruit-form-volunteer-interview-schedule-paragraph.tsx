import { VolunteerInterviewAvailableScheduleParagraph } from '@/features/template/ui/form-set/application-form/volunteer/paragraphs/volunteer-interview-available-schedule-paragraph'

/** 봉사자 모집 폼 — 면접 진행 가능 일정(신청 폼 템플릿 UI 재사용) */
export function RecruitFormVolunteerInterviewScheduleParagraph({
  exceptionScheduleCount = 0,
}: {
  exceptionScheduleCount?: number
}) {
  return (
    <VolunteerInterviewAvailableScheduleParagraph
      isTemplateAuthoringMode
      exceptionScheduleCount={exceptionScheduleCount}
    />
  )
}
