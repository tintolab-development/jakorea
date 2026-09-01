import type { ParticipatingVolunteerRow } from '@/data/mock/participating-volunteers'
import type {
  EmployeeVolunteerSessionRow,
  EmployeeVolunteerSessionRowId,
} from '@/features/program/general/lib/employee-volunteer-session-rows'

export type EmployeeVolunteerSessionCounts = {
  newCount: number
  returningCount: number
}

export type EmployeeVolunteerInstitutionRegistration = {
  institutionId: string
  countsBySessionId: Partial<Record<EmployeeVolunteerSessionRowId, EmployeeVolunteerSessionCounts>>
}

export type EmployeeVolunteerEducationMetrics = {
  /** 교육 실적 — 임직원 자원봉사자(신규 입력 합) */
  staffVolunteers: number
  /** 교육 실적 — 재참여 자원봉사자(임직원 재참여 + 일반 재참여 봉사자 합산) */
  returningVolunteers: number
  /** 사전교육 일정 — 신규·재참여 모두 총 참가자 반영분 */
  preEducationParticipantContribution: number
}

export function createEmptyEmployeeVolunteerFormCounts(
  sessionRows: ReadonlyArray<EmployeeVolunteerSessionRow>
): Partial<Record<EmployeeVolunteerSessionRowId, { newCount?: number; returningCount?: number }>> {
  const counts: Partial<
    Record<EmployeeVolunteerSessionRowId, { newCount?: number; returningCount?: number }>
  > = {}
  for (const row of sessionRows) {
    counts[row.id] = {}
  }
  return counts
}

export function getEmployeeVolunteerCountsForInstitution(
  registrations: ReadonlyArray<EmployeeVolunteerInstitutionRegistration>,
  institutionId: string
): Partial<Record<EmployeeVolunteerSessionRowId, EmployeeVolunteerSessionCounts>> | undefined {
  return registrations.find(entry => entry.institutionId === institutionId)?.countsBySessionId
}

export function upsertEmployeeVolunteerInstitutionRegistration(
  registrations: EmployeeVolunteerInstitutionRegistration[],
  institutionId: string,
  countsBySessionId: Partial<Record<EmployeeVolunteerSessionRowId, EmployeeVolunteerSessionCounts>>
): EmployeeVolunteerInstitutionRegistration[] {
  const nextEntry: EmployeeVolunteerInstitutionRegistration = {
    institutionId,
    countsBySessionId,
  }
  const index = registrations.findIndex(entry => entry.institutionId === institutionId)
  if (index < 0) return [...registrations, nextEntry]
  const next = [...registrations]
  next[index] = nextEntry
  return next
}

export function isEmployeeVolunteerCountFilled(value: number | undefined): value is number {
  return value !== undefined
}

export function hasCompleteEmployeeVolunteerCounts(
  sessionRows: ReadonlyArray<EmployeeVolunteerSessionRow>,
  counts: Partial<Record<EmployeeVolunteerSessionRowId, { newCount?: number; returningCount?: number }>>
): boolean {
  return sessionRows.every(row => {
    const entry = counts[row.id]
    return (
      isEmployeeVolunteerCountFilled(entry?.newCount) &&
      isEmployeeVolunteerCountFilled(entry?.returningCount)
    )
  })
}

/**
 * 일반 봉사자 중 재참여 봉사자 — 기관·회차 기준 카운트.
 * 사전교육 행(`round === null`)은 해당 기관 배정 재참여 봉사자 전체.
 */
export function countGeneralReturningVolunteersForInstitutionSession(
  volunteerList: ReadonlyArray<ParticipatingVolunteerRow>,
  institutionName: string,
  round: number | null
): number {
  return volunteerList.filter(volunteer => {
    if (!volunteer.isReturningVolunteer) return false
    if (!volunteer.assignedInstitutionNames.includes(institutionName)) return false
    if (round == null) return true
    return (volunteer.sessions ?? []).some(session => session.round === round)
  }).length
}

/**
 * 등록값 + 일반 재참여 봉사자를 합산해 교육 실적 봉사자 수를 계산한다.
 * - 신규 → staffVolunteers
 * - 재참여(임직원 입력 + 일반 재참여) → returningVolunteers
 * - 사전교육: 신규·재참여 모두 totalParticipants 반영분에 합산
 */
export function aggregateEmployeeVolunteerEducationMetrics(input: {
  sessionRows: ReadonlyArray<EmployeeVolunteerSessionRow>
  registrations: ReadonlyArray<EmployeeVolunteerInstitutionRegistration>
  volunteerList: ReadonlyArray<ParticipatingVolunteerRow>
  institutionIdToName: ReadonlyMap<string, string>
}): EmployeeVolunteerEducationMetrics {
  let staffVolunteers = 0
  let returningVolunteers = 0
  let preEducationParticipantContribution = 0

  for (const registration of input.registrations) {
    const institutionName = input.institutionIdToName.get(registration.institutionId)
    if (!institutionName) continue

    for (const sessionRow of input.sessionRows) {
      const counts = registration.countsBySessionId[sessionRow.id]
      if (!counts) continue

      staffVolunteers += counts.newCount
      const generalReturning = countGeneralReturningVolunteersForInstitutionSession(
        input.volunteerList,
        institutionName,
        sessionRow.round
      )
      returningVolunteers += counts.returningCount + generalReturning

      if (sessionRow.countsTowardParticipants) {
        preEducationParticipantContribution += counts.newCount + counts.returningCount
      }
    }
  }

  return {
    staffVolunteers,
    returningVolunteers,
    preEducationParticipantContribution,
  }
}
