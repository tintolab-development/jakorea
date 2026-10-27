const INSTITUTION_ASSIGNMENT_PROGRAM_TYPES = new Set([
  'GENERAL_ORGANIZATION',
])

/**
 * 현재 응답 계약으로 기관 배정 현황을 조회할 수 있는 프로그램 유형 후보.
 * GENERAL_INDIVIDUAL은 기관 신청 관계가 없으므로 개인 강의 일정만 노출한다.
 * COMPANY_SCHOOL은 선택적 지원이므로 신규 overview API의 지원 여부 응답 전까지
 * 이 조회로 기관 배정 현황을 노출하지 않는다.
 */
export function supportsInstructorInstitutionAssignment(
  programType: string | null | undefined,
): boolean {
  return INSTITUTION_ASSIGNMENT_PROGRAM_TYPES.has(programType?.trim().toUpperCase() ?? '')
}
