import type { DateValue } from '@/types'
import type { Program, ProgramRound } from '@/types/domain'
import { pickUjatVolunteerRecruitmentRow } from '@/features/program/ujat/lib/ujat-recruit-display-program'
import { readUjatRegistrationOverlayFromProgram } from '@/features/program/ujat/api/service-detail'
import {
  pickUjatRecruitVolunteerOverlay,
  resolveUjatVolunteerActivityTermFromOverlay,
} from '@/features/program/ujat/lib/ujat-recruit-volunteer-template-merge'
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

export function resolveUjatVolunteerActivityTermDisplay(
  program: Program,
  half: UjatVolunteerRecruitHalf
): string {
  const overlay = pickUjatRecruitVolunteerOverlay(readUjatRegistrationOverlayFromProgram(program))
  return (
    resolveUjatVolunteerActivityTermFromOverlay(overlay, half) ||
    getUjatVolunteerRound(program, half)?.curriculum?.trim() ||
    '-'
  )
}

export function getUjatVolunteerRecruitPeriod(
  program: Program,
  half: UjatVolunteerRecruitHalf
): { start?: DateValue; end?: DateValue } {
  const row = pickUjatVolunteerRecruitmentRow(program, half)
  if (row) {
    return {
      start: row.startAt?.trim() ? row.startAt : undefined,
      end: row.endAt?.trim() ? row.endAt : undefined,
    }
  }
  const volunteerRows = (program.programRecruitments ?? []).filter(
    item => (item.recruitmentType ?? '').toUpperCase() === 'VOLUNTEER'
  )
  if (volunteerRows.length > 0) return {}
  return {
    start: program.volunteerApplicationStartDate,
    end: program.volunteerApplicationEndDate,
  }
}
