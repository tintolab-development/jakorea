import type { Program } from '@/types/domain'
import { formatDateRange } from '@/features/program/program-detail/lib/program-detail-info-constants'
import { detailInfoFormSectionHeaderProps } from '@/features/template/lib/writing-form-paragraph-description'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import '@/features/program/program-detail/ui/project-info/project-info-form-shared.css'

/** UJAT 봉사자 모집 — 면접 진행 가능 일정(프로그램 상세 조회) */
export function UjatRecruitInterviewScheduleProgramView({
  program,
  sectionTitle = '면접 진행 가능 일정',
  sectionDescription,
}: {
  program: Program
  sectionTitle?: string
  sectionDescription?: string | null
}) {
  const interviewLine =
    program.interviewStartDate && program.interviewEndDate
      ? formatDateRange(program.interviewStartDate, program.interviewEndDate)
      : '-'

  const headerProps = detailInfoFormSectionHeaderProps(sectionTitle, sectionDescription)

  return (
    <DetailInfoForm {...headerProps} mode="view">
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field label="면접 진행 가능 기간" fullRow view={interviewLine} />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
