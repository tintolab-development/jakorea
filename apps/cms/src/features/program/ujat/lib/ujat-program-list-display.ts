/**
 * UJAT 프로그램 목록 테이블 — 컬럼 표시 helper
 */

import type { Program } from '@/types/domain'

/** 최종 파견 학교 수 */
export function formatUjatDispatchedSchoolCount(program: Program): string {
  return String(program.participatingSchoolCount ?? 0)
}

/**
 * 상반기·하반기 봉사자 모집 인원 — `모집된 인원 / 정원`
 * 정원은 반기별 봉사자 정원만 쓴다(참여 기관 정원·기본값으로 대체하지 않음). 정원 미입력이면 `N / -`.
 */
export function formatUjatVolunteerHalfRecruitment(program: Program, half: 'h1' | 'h2'): string {
  const selected =
    (half === 'h1'
      ? program.ujatFirstHalfVolunteerSelectedCount
      : program.ujatSecondHalfVolunteerSelectedCount) ?? 0
  const capacity =
    half === 'h1' ? program.ujatFirstHalfVolunteerCapacity : program.ujatSecondHalfVolunteerCapacity
  if (capacity == null) return `${selected} / -`
  return `${Math.min(selected, capacity)} / ${capacity}`
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
