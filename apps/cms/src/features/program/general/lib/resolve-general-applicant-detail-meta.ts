import {
  getGeneralIndividualApplicationsForProgram,
  getGeneralParticipantDoc1Applicants,
  getGeneralParticipantDocPassedApplicants,
  getGeneralParticipantInterview2Applicants,
} from '@/data/mock/general-individual-applications-mock'
import { getApplicantInstructorsByProgramId } from '@/data/mock/applicant-instructors'
import { getGeneralInstitutionApplicationsForProgram } from '@/features/program/general/lib/institution-applications-mock'
import type { GeneralDetailLnbKey } from '@/features/program/general/lib/detail-url'
import { resolveGeneralParticipantApplicantDetailTitle } from '@/features/program/general/lib/screening-subject-kind'
import type { ApplicantDetailMeta } from '@/features/program/shared/ui/program-detail/applicant-list/use-applicants-detail'

function findIndividualApplicant(
  programId: string,
  activeTab: string,
  applicantId: string
) {
  const rows =
    activeTab === 'part_doc1'
      ? getGeneralParticipantDoc1Applicants(programId)
      : activeTab === 'part_doc_passed'
        ? getGeneralParticipantDocPassedApplicants(programId)
        : activeTab === 'part_interview2'
          ? getGeneralParticipantInterview2Applicants(programId)
          : getGeneralIndividualApplicationsForProgram(programId)
  return rows.find(row => row.id === applicantId) ?? null
}

/** URL applicantId + LNB/tab에서 신청 상세 breadcrumb·모달 제목용 meta를 파생한다. */
export function resolveGeneralApplicantDetailMetaFromUrl(params: {
  programId: string
  activeLnb: GeneralDetailLnbKey
  activeTab: string
  applicantId: string | null
}): ApplicantDetailMeta {
  const { programId, activeLnb, activeTab, applicantId } = params
  if (!applicantId) return null

  if (activeLnb === 'instructor_applications') {
    const instructor = getApplicantInstructorsByProgramId(programId).find(
      row => row.id === applicantId
    )
    if (!instructor) return null
    return {
      title: `강사 신청 상세 (${instructor.instructorName})`,
      breadcrumbLabel: instructor.instructorName,
      kind: 'instructor',
    }
  }

  if (activeLnb !== 'institution_applications') return null

  const individual = findIndividualApplicant(programId, activeTab, applicantId)
  if (individual) {
    const screeningTitle = resolveGeneralParticipantApplicantDetailTitle(
      activeTab,
      individual.applicantName
    )
    return {
      title: screeningTitle ?? `참여자 신청 상세 (${individual.applicantName})`,
      breadcrumbLabel: individual.applicantName,
      kind: 'individual',
    }
  }

  const institution = getGeneralInstitutionApplicationsForProgram(programId).find(
    row => row.id === applicantId
  )
  if (!institution) return null
  return {
    title: `참여 기관 신청 상세 (${institution.schoolName})`,
    breadcrumbLabel: institution.schoolName,
    kind: 'institution',
  }
}
