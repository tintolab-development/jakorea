import { RecruitFormVolunteerInterviewScheduleParagraph } from '@/features/template/ui/form-set/recruit-form/volunteer/paragraphs/recruit-form-volunteer-interview-schedule-paragraph'

/** UJAT 프로그램 봉사자 모집 폼 — 면접 진행 가능 일정 */
export function UjatRecruitVolunteerInterviewScheduleParagraph({
  exceptionScheduleCount = 0,
}: {
  exceptionScheduleCount?: number
}) {
  return (
    <RecruitFormVolunteerInterviewScheduleParagraph
      exceptionScheduleCount={exceptionScheduleCount}
    />
  )
}
