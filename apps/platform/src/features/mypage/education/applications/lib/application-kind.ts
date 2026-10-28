import type { EducationApplicationListItem } from '../model/types'

export type ApplicationRole = 'participant' | 'volunteer' | 'instructor'

/**
 * 신청 건의 역할 판정.
 * - `volunteer`: 일반 봉사 + UJAT 봉사
 * - `instructor`: 강사 모집(제미나이 강사 포함)
 * - `participant`: 그 외 전부(일반 참여자, 기관/교사, UJAT 기관 등)
 */
export function resolveApplicationRole(item: EducationApplicationListItem): ApplicationRole {
  if (item.applicationType === 'VOLUNTEER') return 'volunteer'
  if (item.applicationType === 'INSTRUCTOR') return 'instructor'
  if (item.applicationType === 'INDIVIDUAL' || item.applicationType === 'ORGANIZATION') {
    return 'participant'
  }

  if (item.detailCase === 'volunteer' || item.detailCase === 'ujat-volunteer') {
    return 'volunteer'
  }
  if (item.detailCase === 'instructor') {
    return 'instructor'
  }
  return 'participant'
}

/** 교육현황 대상. 수강(참여) 역할 신청 — 봉사·강사 역할은 제외(배타적 파티션) */
export function isParticipantRoleApplication(item: EducationApplicationListItem): boolean {
  return resolveApplicationRole(item) === 'participant'
}

/** 봉사현황 대상. 일반 봉사 + UJAT 봉사 통합 */
export function isVolunteerRoleApplication(item: EducationApplicationListItem): boolean {
  return resolveApplicationRole(item) === 'volunteer'
}

/** 강의현황 대상. 강사 역할 신청(제미나이 강사 포함) */
export function isInstructorRoleApplication(item: EducationApplicationListItem): boolean {
  return resolveApplicationRole(item) === 'instructor'
}

/**
 * 교육현황 — 수강(참여) 역할 신청만. 봉사·강사 역할 신청은 각각 봉사현황·강의현황에서만
 * 노출한다(배타적 파티션 — 세 메뉴는 서로 겹치지 않음).
 */
export function filterEducationStatusApplications(
  items: EducationApplicationListItem[],
): EducationApplicationListItem[] {
  return items.filter(isParticipantRoleApplication)
}

/** 봉사현황 — 일반 봉사 + UJAT 봉사 통합 */
export function filterVolunteerStatusApplications(
  items: EducationApplicationListItem[],
): EducationApplicationListItem[] {
  return items.filter(isVolunteerRoleApplication)
}

/** 강의현황 — 강사 역할 신청(제미나이 강사 포함) */
export function filterLectureStatusApplications(
  items: EducationApplicationListItem[],
): EducationApplicationListItem[] {
  return items.filter(isInstructorRoleApplication)
}
