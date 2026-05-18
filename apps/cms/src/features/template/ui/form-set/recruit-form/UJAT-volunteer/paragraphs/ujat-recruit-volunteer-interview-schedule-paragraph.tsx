import { RecruitFormVolunteerInterviewScheduleParagraph } from '@/features/template/ui/form-set/recruit-form/volunteer/paragraphs/recruit-form-volunteer-interview-schedule-paragraph'
import type { UjatRecruitParagraphProps } from '@/features/program/ui/detail-modal/ujat-recruit-paragraph-props'
import { isUjatRecruitProgramContext } from '@/features/program/ui/detail-modal/ujat-recruit-paragraph-props'
import { UjatRecruitInterviewScheduleProgramView } from '@/features/program/ui/detail-modal/ujat-recruit-paragraph-views/interview-schedule-program'

/** UJAT 프로그램 봉사자 모집 폼 — 면접 진행 가능 일정 */
export function UjatRecruitVolunteerInterviewScheduleParagraph({
  exceptionScheduleCount = 0,
  ...props
}: UjatRecruitParagraphProps & { exceptionScheduleCount?: number }) {
  if (isUjatRecruitProgramContext(props) && props.program) {
    return (
      <UjatRecruitInterviewScheduleProgramView
        program={props.program}
        sectionTitle={props.sectionTitle}
        sectionDescription={props.sectionDescription}
      />
    )
  }
  return (
    <RecruitFormVolunteerInterviewScheduleParagraph
      exceptionScheduleCount={exceptionScheduleCount}
    />
  )
}
