/**
 * 실적 관리 전용 파생 헬퍼
 * - program 회차 시작일 → 연도/분기
 * - program ↔ 학교(기관) ↔ 지역(시/도·시/군/구) 매핑
 */

import type { Program } from '@/types/domain'
import { mockApplications } from '@/data/mock'
import { schoolService } from '@/entities/school/api/school-service'
import { MOCK_SIDO_SIGUNGU } from '@/shared/constants/sido-sigungu'
import type { EducationRecordQuarter } from '../model/education-record-types'

export type EducationRecordProgramRegion = {
  schoolId: string
  schoolName: string
  region: string
  sido: string
  si: string
  gun: string
  gu: string
}

/** `region`/`address` 문자열에서 ~시/~군/~구 토큰을 추출한다. */
export function parseRegionTokens(region?: string): {
  si: string
  gun: string
  gu: string
} {
  if (!region) return { si: '', gun: '', gu: '' }
  const tokens = region.trim().split(/\s+/)
  let si = ''
  let gun = ''
  let gu = ''
  for (const token of tokens) {
    if (token.endsWith('시') && !si) si = token
    else if (token.endsWith('군') && !gun) gun = token
    else if (token.endsWith('구') && !gu) gu = token
  }
  return { si, gun, gu }
}

/** 시/군/구 토큰이 속한 시/도(광역단체)를 `MOCK_SIDO_SIGUNGU`에서 역매핑한다. */
export function resolveSidoFromSigunguTokens(tokens: {
  si: string
  gun: string
  gu: string
}): string {
  return (
    MOCK_SIDO_SIGUNGU.find(sido =>
      sido.sigungu.some(
        sg => sg.name === tokens.si || sg.name === tokens.gun || sg.name === tokens.gu
      )
    )?.name ?? ''
  )
}

/**
 * Program → 학교(기관)·지역 정보 Map.
 * 학교 신청(`Application.subjectType === 'school'`)이 없는 프로그램은 포함되지 않는다.
 */
export function buildProgramRegionMap(): Map<string, EducationRecordProgramRegion> {
  const map = new Map<string, EducationRecordProgramRegion>()
  const schools = schoolService.getAllSync()

  for (const app of mockApplications) {
    if (app.subjectType !== 'school' || !app.programId) continue
    if (map.has(app.programId)) continue

    const school = schools.find(s => s.id === app.subjectId)
    if (!school) continue

    const regionText = school.address ?? school.region
    const tokens = parseRegionTokens(regionText)
    const sido = resolveSidoFromSigunguTokens(tokens)

    map.set(app.programId, {
      schoolId: school.id,
      schoolName: school.name,
      region: school.region,
      sido,
      si: tokens.si,
      gun: tokens.gun,
      gu: tokens.gu,
    })
  }

  return map
}

/** `startDate`에서 연도(YYYY)를 꺼낸다. 값이 없거나 파싱 실패 시 `null`. */
export function getProgramYear(program: Program): number | null {
  if (!program.startDate) return null
  const date = new Date(program.startDate)
  if (Number.isNaN(date.getTime())) return null
  return date.getFullYear()
}

/** `startDate`에서 월(1~12)을 꺼낸다. */
export function getProgramMonth(program: Program): number | null {
  if (!program.startDate) return null
  const date = new Date(program.startDate)
  if (Number.isNaN(date.getTime())) return null
  return date.getMonth() + 1
}

/** `startDate`에서 분기(1~4)를 꺼낸다. */
export function getProgramQuarter(program: Program): EducationRecordQuarter | null {
  const month = getProgramMonth(program)
  if (month == null) return null
  return Math.ceil(month / 3) as EducationRecordQuarter
}

/** 프로그램 집합에서 연도(내림차순) 리스트를 만든다. 값이 없으면 빈 배열. */
export function getAvailableYears(programs: Program[]): number[] {
  const set = new Set<number>()
  for (const p of programs) {
    const y = getProgramYear(p)
    if (y != null) set.add(y)
  }
  return Array.from(set).sort((a, b) => b - a)
}
