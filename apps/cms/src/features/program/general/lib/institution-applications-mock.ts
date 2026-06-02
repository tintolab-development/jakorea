import {
  getApplicantSchoolsByProgramId,
  type ApplicantSchoolRow,
} from '@/data/mock/applicant-institutions'

/** 일반 프로그램 상세 — 기관 신청 목록 mock (프로그램 id 연결) */
export function getGeneralInstitutionApplicationsForProgram(
  programId: string
): ApplicantSchoolRow[] {
  return getApplicantSchoolsByProgramId(programId).map(row => ({
    ...row,
    programId,
  }))
}
