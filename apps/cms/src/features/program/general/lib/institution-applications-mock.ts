import {
  getApplicantSchoolsByProgramId,
  MOCK_APPLICANT_INSTITUTIONS,
  type ApplicantSchoolRow,
} from '@/data/mock/applicant-institutions'

function isTrainedTeachersProgramId(programId: string): boolean {
  return (
    programId.startsWith('trained-teachers-prog-') ||
    programId.startsWith('trained-teachers-local-')
  )
}

/** 교육받은 교사 — 프로그램별 기관 신청 mock (legacy null programId 행 제외) */
export function getTrainedTeachersInstitutionApplicationsForProgram(
  programId: string
): ApplicantSchoolRow[] {
  return MOCK_APPLICANT_INSTITUTIONS.filter(row => row.programId === programId).map(row => ({
    ...row,
    programId,
  }))
}

/** 일반 프로그램 상세 — 기관 신청 목록 mock (프로그램 id 연결) */
export function getGeneralInstitutionApplicationsForProgram(
  programId: string
): ApplicantSchoolRow[] {
  if (isTrainedTeachersProgramId(programId)) {
    return getTrainedTeachersInstitutionApplicationsForProgram(programId)
  }
  return getApplicantSchoolsByProgramId(programId).map(row => ({
    ...row,
    programId,
  }))
}
