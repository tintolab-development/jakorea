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

/** 활성 모집 상세용 — 프로그램/회차 canonical 값만 읽고 Overlay로 보완하지 않는다. */
export function resolveUjatVolunteerActivityTermCanonicalDisplay(
  program: Program,
  half: UjatVolunteerRecruitHalf
): string {
  return getUjatVolunteerRound(program, half)?.curriculum?.trim() || '-'
}

export function getUjatVolunteerRecruitPeriod(
  program: Program,
  half: UjatVolunteerRecruitHalf
): { start?: DateValue; end?: DateValue } {
  const row = pickUjatVolunteerRecruitmentRow(program, half)
  if (!row) return {}
  return {
    start: row.startAt?.trim() ? row.startAt : undefined,
    end: row.endAt?.trim() ? row.endAt : undefined,
  }
}
