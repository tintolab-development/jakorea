import type { ProgramApplicationType } from '../api/types'

const EDUCATION_APPLICATION_TYPES = new Set<ProgramApplicationType>(['INDIVIDUAL', 'ORGANIZATION'])

/** `/mypage/education/:applicationType/:applicationId` 라우트 segment */
export function readEducationApplicationTypeFromRoute(
  value: string | undefined,
): ProgramApplicationType | null {
  if (value && EDUCATION_APPLICATION_TYPES.has(value as ProgramApplicationType)) {
    return value as ProgramApplicationType
  }
  return null
}

/**
 * 알림톡 등에서 `/mypage/education/{role}/{id}` 로 들어온 강사·봉사 딥링크.
 * 교육현황 상세는 INDIVIDUAL/ORGANIZATION만 렌더하므로 기존 강의·봉사 상세로 보낸다.
 * VOLUNTEER를 INDIVIDUAL로 바꾸지 않는다.
 */
export function resolveEducationIncomingDeeplinkBouncePath(
  applicationType: string | undefined,
  applicationId: string,
): string | null {
  const id = applicationId.trim()
  if (!id) return null
  if (applicationType === 'INSTRUCTOR') return `/mypage/lectures/INSTRUCTOR/${id}`
  if (applicationType === 'VOLUNTEER') return `/mypage/volunteer/VOLUNTEER/${id}`
  return null
}
