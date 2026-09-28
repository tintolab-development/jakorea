/**
 * UJAT 프로그램 목록 테이블 — 컬럼 표시 helper
 */

import { getCapacity } from '@/features/program/general/lib/program-helpers'
import type { Program } from '@/types/domain'

const UJAT_VOLUNTEER_CAP_FALLBACK = 30

function formatCurrentTotal(current: number, total: number): string {
  return `${current} / ${total}`
}

function roundCapacity(program: Program, half: 'h1' | 'h2'): number {
  const round = program.rounds[half === 'h1' ? 0 : 1]
  return round?.capacity ?? program.instructorCapacity ?? getCapacity(program) ?? UJAT_VOLUNTEER_CAP_FALLBACK
}

/** 최종 파견 학교 수 */
export function formatUjatDispatchedSchoolCount(program: Program): string {
  return String(program.participatingSchoolCount ?? 0)
}

/** 상반기·하반기 봉사자 모집 인원 — `현재 / 정원` */
export function formatUjatVolunteerHalfRecruitment(program: Program, half: 'h1' | 'h2'): string {
  const cap = roundCapacity(program, half)
  const raw =
    half === 'h1'
      ? (program.ujatFirstHalfVolunteerCount ?? program.generalVolunteers ?? 0)
      : (program.ujatSecondHalfVolunteerCount ?? 0)
  const current = Math.min(raw, cap)
  return formatCurrentTotal(current, cap)
}

function overlayText(program: Program, key: string): string | undefined {
  const value = program.ujatRegistrationOverlay?.[key]
  return typeof value === 'string' ? value.trim() || undefined : undefined
}

/** 목록·상세 모달 타이틀 — 대표 프로그램명 (국문) */
export function resolveUjatProgramDisplayTitle(program: Program): string {
  return (
    program.mainTitle?.trim() ||
    overlayText(program, 'ujat.basicInfo.repKo') ||
    program.title?.trim() ||
    '프로그램 상세'
  )
}

