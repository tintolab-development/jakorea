/**
 * 일반 프로그램 봉사자 신청 목록 — 탭별 mock 조회·정렬
 */

import {
  getGeneralVolunteerDoc1Applicants as getGeneralVolunteerDoc1MockApplicants,
  getGeneralVolunteerDocPassedApplicants as getGeneralVolunteerDocPassedMockApplicants,
  getGeneralVolunteerInterview2Applicants as getGeneralVolunteerInterview2MockApplicants,
  sortGeneralVolunteerByInterviewSlotCount,
  type GeneralVolunteerApplicantRow,
} from '@/data/mock/general-volunteer-applicants-mock'

/** 면접 가능 일정 수 오름차순 (일반 1차 서류·합격자 목록) */
export { sortGeneralVolunteerByInterviewSlotCount }

/** 1차 서류 심사 대상자 — 서류 심사 전(pending)만 */
export function getGeneralVolunteerDoc1Applicants(
  programId: string
): GeneralVolunteerApplicantRow[] {
  return getGeneralVolunteerDoc1MockApplicants(programId)
}

/** 1차 서류 합격자 — 합격 + 면접일 배정 대기 */
export function getGeneralVolunteerDocPassedApplicants(
  programId: string
): GeneralVolunteerApplicantRow[] {
  return getGeneralVolunteerDocPassedMockApplicants(programId)
}

/** 2차 면접 대상자 — 면접일 배정 완료 */
export function getGeneralVolunteerInterview2Applicants(
  programId: string
): GeneralVolunteerApplicantRow[] {
  return getGeneralVolunteerInterview2MockApplicants(programId)
}
