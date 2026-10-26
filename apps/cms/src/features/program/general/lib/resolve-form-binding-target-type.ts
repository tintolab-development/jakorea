/**
 * `OperationalFormSpec.targetRole`(FE 내부 role 표기) → create/binding body `targetType`
 * (BE canonical 표기, `ProgramRecruitmentRequest.targetType` 주석 기준: PARTICIPANT=ORGANIZATION|INDIVIDUAL,
 * INSTRUCTOR=TEACHER, VOLUNTEER=COLLEGE_STUDENT).
 *
 * `targetRole`만 보내고 `targetType`을 비워두면 BE가 `recruitments[].targetType`과 매칭하지 못해
 * 일반 프로그램 신청/모집 form-binding이 "없음"으로 판정되어 거절될 수 있다
 * (`GENERAL_PROGRAM_APPLICATION_FORM_BINDING_REQUIRED` 등, 2026-09-21 관측).
 */
export function resolveFormBindingTargetType(targetRole: string): string {
  if (targetRole === 'INSTRUCTOR') return 'TEACHER'
  if (targetRole === 'VOLUNTEER') return 'COLLEGE_STUDENT'
  return targetRole
}

const CANONICAL_BINDING_AUDIENCES = new Set([
  'INSTRUCTOR',
  'VOLUNTEER',
  'ORGANIZATION',
  'INDIVIDUAL',
])

/**
 * 바인딩 `targetType` / 모집 `applicationType` 별칭을 BE 정규값으로 맞춘다.
 * BE `ProgramRecruitmentFormBindingSupport.canonicalTarget` 와 같은 규칙
 * (TEACHER→INSTRUCTOR, COLLEGE_STUDENT→VOLUNTEER, SCHOOL·INSTITUTION→ORGANIZATION, PERSONAL→INDIVIDUAL).
 */
export function canonicalFormBindingTarget(value: string | null | undefined): string {
  const normalized = (value ?? '').trim().toUpperCase().replace(/-/g, '_')
  switch (normalized) {
    case 'TEACHER':
      return 'INSTRUCTOR'
    case 'COLLEGE_STUDENT':
      return 'VOLUNTEER'
    case 'SCHOOL':
    case 'INSTITUTION':
      return 'ORGANIZATION'
    case 'PERSONAL':
      return 'INDIVIDUAL'
    default:
      return normalized
  }
}

/** 정규화 결과가 신청 대상(강사/봉사자/기관/개인) 중 하나인지 */
export function isCanonicalFormBindingAudience(value: string): boolean {
  return CANONICAL_BINDING_AUDIENCES.has(value)
}
