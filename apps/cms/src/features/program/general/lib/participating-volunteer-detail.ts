import type { ParticipatingVolunteerRow } from '@/data/mock/participating-volunteers'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import { formatParticipatingSchoolSessionLine } from '@/features/program/general/lib/participating-school-session-display'
import type { ActivityWithdrawScheduleOption } from '@/features/program/shared/lib/activity-withdraw-schedule'
import type { GeneralVolunteerApplicationType } from '@/features/program/general/lib/volunteer-screening-constants'
import { MASKING_POLICY } from '@/shared/constants/download-policy'

export type ParticipatingVolunteerDetailRow = ParticipatingVolunteerRow

export function mergeParticipatingVolunteerDetailRow(
  row: ParticipatingVolunteerRow
): ParticipatingVolunteerDetailRow {
  const contactRaw = row.contactRaw ?? row.contact
  const emailRaw = row.emailRaw ?? row.email
  return {
    ...row,
    contactRaw,
    emailRaw,
    contact: row.contact || MASKING_POLICY.phone(contactRaw.replace(/\s/g, '')) || contactRaw,
    email: row.email || MASKING_POLICY.email(emailRaw) || emailRaw,
    gender: row.gender ?? '여성',
    birthDate: row.birthDate ?? '-',
    age: row.age ?? 0,
    scheduleChangeCancelCount: row.scheduleChangeCancelCount ?? 0,
    hasJaVolunteerExperience: row.hasJaVolunteerExperience ?? false,
    applicationType: row.applicationType ?? 'new',
    adminComment: row.adminComment ?? '',
    activityWithdrawn: row.activityWithdrawn ?? false,
    performanceExcludedSessionKeys: row.performanceExcludedSessionKeys ?? [],
    essayIntro: row.essayIntro ?? '',
    essayEducationExperience: row.essayEducationExperience ?? '',
    essayNecessity: row.essayNecessity ?? '',
    essayJaExperience: row.essayJaExperience ?? '',
  }
}

/** 1차 서류 심사 상세 `GeneralVolunteerApplicantBasicInfo`·자유 작성 항목 재사용용 */
export function participatingVolunteerToApplicantView(
  volunteer: ParticipatingVolunteerDetailRow,
  options?: { maskSensitive?: boolean }
): GeneralVolunteerApplicantRow {
  const maskSensitive = options?.maskSensitive ?? true
  const contactRaw = volunteer.contactRaw ?? volunteer.contact
  const emailRaw = volunteer.emailRaw ?? volunteer.email
  return {
    id: volunteer.id,
    no: volunteer.no,
    name: volunteer.volunteerName,
    contact: maskSensitive
      ? MASKING_POLICY.phone(contactRaw.replace(/\s/g, '')) || volunteer.contact
      : contactRaw,
    email: maskSensitive ? MASKING_POLICY.email(emailRaw) || volunteer.email : emailRaw,
    contactRaw,
    emailRaw,
    id1365: volunteer.id1365,
    scheduleChangeCancelCount: volunteer.scheduleChangeCancelCount ?? 0,
    applicationType: (volunteer.applicationType ?? 'new') as GeneralVolunteerApplicationType,
    hasJaVolunteerExperience: volunteer.hasJaVolunteerExperience ?? false,
    essayIntro: volunteer.essayIntro ?? '',
    essayEducationExperience: volunteer.essayEducationExperience ?? '',
    essayNecessity: volunteer.essayNecessity ?? '',
    essayJaExperience: volunteer.essayJaExperience ?? '',
    managerAEvaluation: 'unreviewed',
    managerBEvaluation: 'unreviewed',
    documentScreeningStatus: 'pass',
    interviewSlotCount: 0,
    interviewAssignmentStatus: 'assigned',
    programId: '',
    englishName: volunteer.volunteerName,
    gender: volunteer.gender ?? '-',
    birthDate: volunteer.birthDate ?? '-',
    age: volunteer.age ?? 0,
    universityName: '-',
    major: '-',
    applicationRoute: '-',
    interviewAvailability: [],
  }
}

export function getParticipatingVolunteerActivityWithdrawScheduleOptions(
  volunteer: ParticipatingVolunteerDetailRow
): ActivityWithdrawScheduleOption[] {
  const excluded = new Set(volunteer.performanceExcludedSessionKeys ?? [])
  return (volunteer.sessions ?? [])
    .filter(session => !excluded.has(String(session.round)))
    .map(session => ({
      value: String(session.round),
      label: formatParticipatingSchoolSessionLine(session),
    }))
}

export function applyParticipatingVolunteerActivityWithdraw(
  volunteer: ParticipatingVolunteerDetailRow,
  payload: { stopSessionKey: string }
): Partial<ParticipatingVolunteerDetailRow> {
  const excluded = new Set(volunteer.performanceExcludedSessionKeys ?? [])
  const stopKey = payload.stopSessionKey
  const sessions = volunteer.sessions ?? []
  const stopIndex = sessions.findIndex(session => String(session.round) === stopKey)
  if (stopIndex < 0) return {}

  const nextExcluded = [
    ...excluded,
    ...sessions.slice(stopIndex).map(session => String(session.round)),
  ]

  return {
    activityWithdrawn: true,
    activityWithdrawStopSessionKey: stopKey,
    performanceExcludedSessionKeys: Array.from(new Set(nextExcluded)),
  }
}
