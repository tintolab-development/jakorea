import type { ParticipatingSchoolSession } from '@/data/mock/participating-schools'
import { getSessionLineParts } from '@/features/program/shared/ui/program-detail/applicant-list/applicants-detail-session-format'
import { resolveParticipatingInstitutionScheduleRowLabel } from '@/features/program/general/lib/participating-school-session-display'
import type { SchoolDetailForModal } from '@/features/program/general/model/school-detail-types'
import type {
  ActivityWithdrawScheduleConfirmPayload,
  ActivityWithdrawScheduleOption,
} from '@/features/program/shared/lib/activity-withdraw-schedule'
import type { Program } from '@/types/domain'

export type { ActivityWithdrawScheduleOption as ParticipatingInstitutionActivityWithdrawScheduleOption }
export type { ActivityWithdrawScheduleConfirmPayload as ParticipatingInstitutionActivityWithdrawPayload }

function padScheduleTimePart(part: string): string {
  const trimmed = part.trim()
  const [h, m = '00'] = trimmed.split(':')
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
}

export function buildParticipatingSchoolSessionKey(
  session: ParticipatingSchoolSession,
  index: number
): string {
  return `${session.round}-${session.date}-${index}`
}

export function formatParticipatingInstitutionActivityWithdrawScheduleOptionLabel(
  program: Program,
  session: ParticipatingSchoolSession
): string {
  const rowLabel = resolveParticipatingInstitutionScheduleRowLabel(program, session)
  const { datePart, periodPart } = getSessionLineParts(session, 'general-detail')
  const [startRaw, endRaw] = session.timeRange.split('~')
  const timePart = `${padScheduleTimePart(startRaw)} ~ ${padScheduleTimePart(endRaw ?? startRaw)}`
  const dateTimePart = `${datePart} ${timePart}`

  if (rowLabel === '교육 일정') {
    return periodPart ? `${dateTimePart} | ${periodPart}` : dateTimePart
  }

  return periodPart ? `${rowLabel} | ${dateTimePart} | ${periodPart}` : `${rowLabel} | ${dateTimePart}`
}

/** 활동 포기 모달 — 교육 일정 선택지 */
export function getParticipatingInstitutionActivityWithdrawScheduleOptions(
  program: Program,
  sessions: ReadonlyArray<ParticipatingSchoolSession>,
  excludedSessionKeys: ReadonlyArray<string> = []
): ActivityWithdrawScheduleOption[] {
  const excluded = new Set(excludedSessionKeys)

  return sessions
    .map((session, index) => ({
      session,
      index,
      key: buildParticipatingSchoolSessionKey(session, index),
    }))
    .filter(({ key }) => !excluded.has(key))
    .map(({ session, key }) => ({
      value: key,
      label: formatParticipatingInstitutionActivityWithdrawScheduleOptionLabel(program, session),
    }))
}

export function resolveParticipatingInstitutionActivityWithdrawPatch(
  program: Program,
  sessions: ReadonlyArray<ParticipatingSchoolSession>,
  stopSessionKey: string
): Pick<
  SchoolDetailForModal,
  'activityWithdrawn' | 'activityWithdrawStopSessionKey' | 'activityWithdrawStopScheduleLabel'
> | null {
  const matched = sessions
    .map((session, index) => ({
      session,
      key: buildParticipatingSchoolSessionKey(session, index),
    }))
    .find(({ key }) => key === stopSessionKey)

  if (!matched) return null

  return {
    activityWithdrawn: true,
    activityWithdrawStopSessionKey: stopSessionKey,
    activityWithdrawStopScheduleLabel:
      formatParticipatingInstitutionActivityWithdrawScheduleOptionLabel(
        program,
        matched.session
      ),
  }
}
