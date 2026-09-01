import type { Program } from '@/types/domain'
import { ApplicantList } from '@/features/program/shared/ui/program-detail/applicant-list/applicant-list'
import type { ApplicantDetailMeta } from '@/features/program/shared/ui/program-detail/applicant-list/use-applicants-detail'
import './participant-applications.css'

export interface GeneralInstructorApplicationsViewProps {
  program: Program
  onRegisterApplicantCloseHandler?: (fn: (() => boolean) | null) => void
  onApplicantDetailMetaChange?: (meta: ApplicantDetailMeta) => void
}

export function GeneralInstructorApplicationsView({
  program,
  onRegisterApplicantCloseHandler,
  onApplicantDetailMetaChange,
}: GeneralInstructorApplicationsViewProps) {
  return (
    <div className="participant-applications general-instructor-applications">
      <ApplicantList
        menu="instructors"
        program={program}
        programId={program.id}
        listTitle="강사 신청 목록"
        instructorColumnPreset="general-detail"
        detailVariant="general"
        onRegisterApplicantCloseHandler={onRegisterApplicantCloseHandler}
        onApplicantDetailMetaChange={onApplicantDetailMetaChange}
      />
    </div>
  )
}
