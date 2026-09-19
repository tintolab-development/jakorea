import type { EducationApplicationListItem } from '../model/types'

export type ApplicationRole = 'participant' | 'volunteer' | 'instructor'

/**
 * Gemini 강사 모집 프로그램 id 패턴 — `apply-form-case.ts`의 `isGeminiInstructorProgramId`와
 * 동일 기준. 강의현황 범위에서는 Gemini 강사 모집을 제외한다(별도 기획 예정).
 */
function isGeminiInstructorProgramId(programId: string): boolean {
  return programId.includes('gemini-prog-instructor')
}

/**
 * 신청 건의 역할 판정.
 * - `volunteer`: 일반 봉사 + UJAT 봉사
 * - `instructor`: 강사 모집(Gemini 강사 모집은 이번 범위에서 제외)
 * - `participant`: 그 외 전부(일반 참여자, 기관/교사, UJAT 기관 등)
 */
export function resolveApplicationRole(item: EducationApplicationListItem): ApplicationRole {
  if (item.detailCase === 'volunteer' || item.detailCase === 'ujat-volunteer') {
    return 'volunteer'
  }
  if (item.detailCase === 'instructor' && !isGeminiInstructorProgramId(item.programId)) {
    return 'instructor'
  }
  return 'participant'
}

/** 봉사현황 대상. 일반 봉사 + UJAT 봉사 통합 */
export function isVolunteerRoleApplication(item: EducationApplicationListItem): boolean {
  return resolveApplicationRole(item) === 'volunteer'
}

/** 강의현황 대상. 강사 역할 신청(Gemini 강사 모집 제외) */
export function isInstructorRoleApplication(item: EducationApplicationListItem): boolean {
  return resolveApplicationRole(item) === 'instructor'
}

/** 교육현황 — 전체 신청 노출(역할 무관, 슈퍼셋). 봉사·강의현황과 중복 노출 허용 */
export function filterEducationStatusApplications(
  items: EducationApplicationListItem[],
): EducationApplicationListItem[] {
  return items
}

/** 봉사현황 — 일반 봉사 + UJAT 봉사 통합 */
export function filterVolunteerStatusApplications(
  items: EducationApplicationListItem[],
): EducationApplicationListItem[] {
  return items.filter(isVolunteerRoleApplication)
}

/** 강의현황(신규) — 강사 역할 신청(Gemini 강사 모집 제외) */
export function filterLectureStatusApplications(
  items: EducationApplicationListItem[],
): EducationApplicationListItem[] {
  return items.filter(isInstructorRoleApplication)
}
