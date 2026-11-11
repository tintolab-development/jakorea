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
        // 시안 1141:241422(기관)·9899:148010(개인) — 캘린더 뷰 필터는 리스트뷰와 같다(「자택 주소지」).
        instructorCalendarFilterPreset="list-parity"
        detailVariant="general"
        onRegisterApplicantCloseHandler={onRegisterApplicantCloseHandler}
        onApplicantDetailMetaChange={onApplicantDetailMetaChange}
      />
    </div>
  )
}
