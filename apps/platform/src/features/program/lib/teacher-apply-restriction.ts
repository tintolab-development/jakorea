/**
 * 교사 회원 신청 제한 — 청소년·청년 카테고리 공고.
 *
 * - 일반 프로그램(개인) 참여자 모집(`GENERAL_INDIVIDUAL` + `INDIVIDUAL`)
 * - 모든 프로그램의 봉사자 모집(`VOLUNTEER`)
 *
 * 위 모집은 교사 회원(교사 겸직 강사 포함)이 신청할 수 없고, 상세 [신청하기]에서
 * 「신청 대상이 아닙니다」 모달(`not-eligible`)로 막는다.
 */
export function isTeacherRestrictedApplication(input: {
  isTeacher: boolean
  programType: string | null | undefined
  applicationType: string | null | undefined
}): boolean {
  if (!input.isTeacher) return false
  const applicationType = (input.applicationType ?? '').trim().toUpperCase()
  if (applicationType === 'VOLUNTEER') return true
  const programType = (input.programType ?? '').trim().toUpperCase()
  return applicationType === 'INDIVIDUAL' && programType === 'GENERAL_INDIVIDUAL'
}
