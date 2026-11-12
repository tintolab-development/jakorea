/**
 * 알림 「발표일에 맞춰서」가 따르는 모집의 최종 발표일 (GET `recruitments[].finalPassAnnouncementAt`).
 * - 기관 신청: 참여자 모집(PARTICIPANT) 중 기관(ORGANIZATION) 행
 * - 개인 신청: 참여자 모집 중 개인(INDIVIDUAL) 행
 * - 강사: 강사 모집(INSTRUCTOR) 최종 합격 발표일
 * - 봉사자: 봉사자 모집(VOLUNTEER) 발표일. UJAT는 상·하반기(`recruitTerm`) 행을 고른다.
 * 행이 없거나, 같은 조건 행이 여럿인데 값이 다르면 null(지어내지 않는다).
 */
import type { Program, ProgramRecruitmentWindow } from '@/types/domain'

export type NotifyAnnouncementAudience = 'organization' | 'individual' | 'instructor' | 'volunteer'

function upper(value: string | null | undefined): string {
  return value?.trim().toUpperCase() ?? ''
}

function matchesAudience(
  row: ProgramRecruitmentWindow,
  audience: NotifyAnnouncementAudience
): boolean {
  const recruitmentType = upper(row.recruitmentType)
  const applicationType = upper(row.applicationType)
  if (audience === 'instructor') {
    return recruitmentType === 'INSTRUCTOR' || applicationType === 'INSTRUCTOR'
  }
  if (audience === 'volunteer') {
    return recruitmentType === 'VOLUNTEER' || applicationType === 'VOLUNTEER'
  }
  if (recruitmentType && recruitmentType !== 'PARTICIPANT') return false
  return applicationType === (audience === 'organization' ? 'ORGANIZATION' : 'INDIVIDUAL')
}

export function resolveRecruitmentFinalAnnouncementAt(
  program: Pick<Program, 'programRecruitments'> | null | undefined,
  audience: NotifyAnnouncementAudience,
  options?: { recruitTerm?: 'FIRST_HALF' | 'SECOND_HALF' | null }
): string | null {
  const rows = (program?.programRecruitments ?? []).filter(row => matchesAudience(row, audience))
  const term = options?.recruitTerm ?? null
  const scoped = term ? rows.filter(row => row.recruitTerm === term) : rows
  const values = Array.from(
    new Set(
      scoped
        .map(row => row.finalPassAnnouncementAt?.trim() ?? '')
        .filter((value): value is string => value.length > 0)
    )
  )
  return values.length === 1 ? values[0]! : null
}
