import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import { isGeneralProgramTempMockOrgProgramId } from '@/features/program/general/api/temp-mock-capabilities'
import { getTempMockOrgApplicantSchools } from '@/features/program/general/lib/temp-mock-org-program'

/** 교육받은 교사 — 기관 신청 목록 (remote only) */
export function getTrainedTeachersInstitutionApplicationsForProgram(
  _programId: string
): ApplicantSchoolRow[] {
  return []
}

/** 일반 프로그램 상세 — 기관 신청 목록 */
export function getGeneralInstitutionApplicationsForProgram(
  programId: string
): ApplicantSchoolRow[] {
  if (!isGeneralProgramTempMockOrgProgramId(programId)) return []
  return getTempMockOrgApplicantSchools(programId)
}
