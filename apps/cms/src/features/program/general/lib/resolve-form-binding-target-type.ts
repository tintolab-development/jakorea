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
