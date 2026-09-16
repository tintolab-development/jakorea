import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'

/** 교육받은 교사 — 기관 신청 목록 (remote only) */
export function getTrainedTeachersInstitutionApplicationsForProgram(
  _programId: string
): ApplicantSchoolRow[] {
  return []
}

/** 일반 프로그램 상세 — 기관 신청 목록 (remote only) */
export function getGeneralInstitutionApplicationsForProgram(
  _programId: string
): ApplicantSchoolRow[] {
  return []
}
