import type { DateValue } from '@/types'
import type { Program, ProgramRound } from '@/types/domain'
import { pickRecruitmentCopyRow } from '@/features/program/shared/lib/recruitment-row-copy'
import { readUjatRegistrationOverlayFromProgram } from '@/features/program/ujat/api/service-detail'
import {
  pickUjatRecruitVolunteerOverlay,
  resolveUjatVolunteerActivityTermFromOverlay,
} from '@/features/program/ujat/lib/ujat-recruit-volunteer-template-merge'
import { loadUjatRecruitVolunteerTemplateSave } from '@/features/program/ujat/lib/ujat-recruit-template-local-save'
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
  const overlay = {
    ...(loadUjatRecruitVolunteerTemplateSave()?.overlay ?? {}),
    ...pickUjatRecruitVolunteerOverlay(readUjatRegistrationOverlayFromProgram(program)),
  }
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
  const row = pickRecruitmentCopyRow(program, 'volunteer', half)
  if (row?.startAt || row?.endAt) {
    return {
      start: row.startAt ?? undefined,
      end: row.endAt ?? undefined,
    }
  }
  const round = getUjatVolunteerRound(program, half)
  if (round?.startDate && round?.endDate) {
    return { start: round.startDate, end: round.endDate }
  }
  return {
    start: program.volunteerApplicationStartDate ?? program.applicationStartDate,
    end: program.volunteerApplicationEndDate ?? program.applicationEndDate,
  }
}
