import type { Program } from '@/types/domain'
import { formatDateRange } from '@/features/program/shared/lib/program-detail-info-constants'
import { getUjatVolunteerInterviewScheduleMock } from '@/data/mock/ujat-volunteer-interview-schedule'
import type { UjatVolunteerRecruitHalf } from '@/features/program/ujat/ui/detail-modal/info/ujat-recruit-paragraph-props'
import { UjatVolunteerInterviewScheduleReadonly } from '@/features/program/ujat/ui/detail-modal/info/ujat-volunteer-interview-schedule-readonly'
import { detailInfoFormSectionTitleHeaderProps } from '@/features/template/lib/writing-form-paragraph-description'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'
import './interview-schedule-program.css'

/** UJAT 봉사자 모집 — 면접 진행 가능 일정(프로그램 상세 조회) */
export function UjatRecruitInterviewScheduleProgramView({
  program,
  volunteerHalf,
  sectionTitle = '면접 진행 가능 일정',
}: {
  program: Program
  volunteerHalf?: UjatVolunteerRecruitHalf
  sectionTitle?: string
}) {
  const scheduleData = getUjatVolunteerInterviewScheduleMock(program.id, volunteerHalf)

  const interviewLine =
    program.interviewStartDate && program.interviewEndDate
      ? formatDateRange(program.interviewStartDate, program.interviewEndDate)
      : '-'

  const headerProps = detailInfoFormSectionTitleHeaderProps(sectionTitle)

  return (
    <div className="ujat-recruit-interview-schedule-program-view">
      <DetailInfoForm {...headerProps} mode="view">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field label="면접 진행 가능 기간" fullRow view={interviewLine} />
        </DetailInfoForm.Row>
      </DetailInfoForm>
      <UjatVolunteerInterviewScheduleReadonly data={scheduleData} />
    </div>
  )
}
