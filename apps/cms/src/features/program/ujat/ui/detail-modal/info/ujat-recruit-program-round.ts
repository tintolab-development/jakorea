import type { DateValue } from '@/types'
import type { Program, ProgramRound } from '@/types/domain'
import type { UjatVolunteerRecruitHalf } from './ujat-recruit-paragraph-props'

export function getUjatVolunteerRound(
  program: Program,
  half: UjatVolunteerRecruitHalf
): ProgramRound | undefined {
  const rounds = program.rounds ?? []
  const targetNumber = half === 'h1' ? 1 : 2
  const byNumber = rounds.find(r => r.roundNumber === targetNumber)
  if (byNumber) return byNumber
  return half === 'h1' ? rounds[0] : rounds[1]
}

export function getUjatVolunteerRecruitPeriod(
  program: Program,
  half: UjatVolunteerRecruitHalf
): { start?: DateValue; end?: DateValue } {
  const round = getUjatVolunteerRound(program, half)
  if (round?.startDate && round?.endDate) {
    return { start: round.startDate, end: round.endDate }
  }
  return {
    start: program.volunteerApplicationStartDate ?? program.applicationStartDate,
    end: program.volunteerApplicationEndDate ?? program.applicationEndDate,
  }
}
