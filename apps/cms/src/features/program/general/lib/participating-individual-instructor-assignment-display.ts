import type { ParticipatingSchoolSession } from '@/data/mock/participating-schools'
import { formatIndividualInstructorEducationScheduleLabel } from '@/features/program/general/lib/participating-individual-instructor-lecture-report-display'
import { resolveParticipatingInstitutionScheduleRowLabel } from '@/features/program/general/lib/participating-school-session-display'
import type { Program } from '@/types/domain'

/** 출강지 — 시·도 + 구·군 (상세 주소는 제외) */
export function formatIndividualInstructorLectureLocation(region: string): string {
  const tokens = region.trim().split(/\s+/).filter(Boolean)
  if (tokens.length >= 2) return `${tokens[0]} ${tokens[1]}`
  return region.trim() || '-'
}

function resolveAssignmentSessionName(
  program: Program,
  sessionRound?: number
): string | undefined {
  if (!sessionRound) return undefined

  const session = {
    round: sessionRound,
    date: '',
    dayOfWeek: '',
    duration: '',
    format: '',
    classNum: '',
    timeRange: '',
  } satisfies ParticipatingSchoolSession

  const label = resolveParticipatingInstitutionScheduleRowLabel(program, session)
  return label === '교육 일정' ? undefined : label
}

/** 담당·희망 교육 일정 — 날짜 / 진행 시간 / 회차·일정명(없을 수 있음) */
export function formatIndividualInstructorAssignmentScheduleLabel(
  program: Program,
  input: {
    dateKey: string
    timeRange?: string
    sessionRound?: number
    sessionName?: string | null
  }
): string {
  const sessionName =
    input.sessionName?.trim() ||
    resolveAssignmentSessionName(program, input.sessionRound) ||
    undefined

  return formatIndividualInstructorEducationScheduleLabel({
    dateKey: input.dateKey,
    timeRange: input.timeRange,
    sessionName,
  })
}
