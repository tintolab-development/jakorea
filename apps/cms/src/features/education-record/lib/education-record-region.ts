/**
 * 실적 관리 전용 파생 헬퍼
 * - program 회차 시작일 → 연도/분기
 * - program ↔ 학교(기관) ↔ 지역(시/도·시/군/구) 매핑
 */

import type { Program } from '@/types/domain'
import { mockApplications } from '@/data/mock'
import { schoolService } from '@/entities/school/api/school-service'
import { parseRegionTokens, resolveSidoFromSigunguTokens } from '@jakorea/location/sido-sigungu'
import type {
  EducationRecordQuarter,
  EducationRecordRow,
} from '../model/education-record-types'

export { parseRegionTokens, resolveSidoFromSigunguTokens }

export type EducationRecordProgramRegion = {
  schoolId: string
  schoolName: string
  region: string
  sido: string
  si: string
  gun: string
  gu: string
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

/** `educationMonth` 또는 `startDate`에서 연도(YYYY)를 꺼낸다. */
export function getRowYear(row: EducationRecordRow): number | null {
  if (row.educationMonth) {
    const yearPart = row.educationMonth.trim().slice(0, 4)
    const year = Number(yearPart)
    if (/^\d{4}$/.test(yearPart) && Number.isFinite(year)) return year
  }
  if (!row.startDate) return null
  const date = new Date(row.startDate)
  if (Number.isNaN(date.getTime())) return null
  return date.getFullYear()
}

/** `educationMonth` 또는 `startDate`에서 분기(1~4)를 꺼낸다. */
export function getRowQuarter(row: EducationRecordRow): EducationRecordQuarter | null {
  let month: number | null = null
  if (row.educationMonth) {
    const parts = row.educationMonth.trim().split('-')
    if (parts.length >= 2) {
      month = Number(parts[1])
    }
  }
  if (month == null && row.startDate) {
    const date = new Date(row.startDate)
    if (!Number.isNaN(date.getTime())) month = date.getMonth() + 1
  }
  if (month == null || month < 1 || month > 12) return null
  return Math.ceil(month / 3) as EducationRecordQuarter
}

/** 실적 행 집합에서 연도(내림차순) 리스트를 만든다. */
export function getAvailableYearsFromRows(rows: EducationRecordRow[]): number[] {
  const set = new Set<number>()
  for (const row of rows) {
    const y = getRowYear(row)
    if (y != null) set.add(y)
  }
  return Array.from(set).sort((a, b) => b - a)
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
