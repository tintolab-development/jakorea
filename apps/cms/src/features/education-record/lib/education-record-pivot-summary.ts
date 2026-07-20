/**
 * 실적 관리 엑셀 시트2(합계)용 — 필터된 Program[] 를 피벗형 행 모델로 집계한다.
 */

import type { TargetLevel } from '@/types/domain'
import type { EducationRecordRow } from '@/features/education-record/model/education-record-types'

/** 시트 헤더(스크린샷 13열) */
export const PIVOT_SHEET_HEADERS = [
  '행 레이블',
  '개수: 학교명(기관)',
  '합계: 교육시간',
  '합계: 학급수',
  '합계: 남',
  '합계: 여',
  '합계: 총참가자',
  '합계: 일반자원봉사자',
  '합계: 임직원자원봉사자',
  '합계: 재참여자원봉사자',
  '합계: 일반담당교사',
  '합계: 교육받은교사',
  '합계: 강사',
] as const

const KNOWN_BUSINESS_AREAS = new Set<string>([
  '경제금융',
  '진로취업',
  '기업가정신',
  '디지털리터러시',
])

const TARGET_ORDER_FIVE = [
  'elementary',
  'middle',
  'high',
  'university',
  'adult',
] as const satisfies readonly TargetLevel[]

const TARGET_ORDER_DIGITAL = ['high', 'university', 'adult'] as const satisfies readonly TargetLevel[]

const TARGET_LABEL: Record<TargetLevel, string> = {
  elementary: '초',
  middle: '중',
  high: '고',
  university: '대학생',
  adult: '성인',
}

type PivotBucket = TargetLevel | 'unknown'

export type PivotMetrics = {
  schoolCount: number
  educationHours: number
  classCount: number
  male: number
  female: number
  totalParticipants: number
  generalVolunteers: number
  staffVolunteers: number
  returningVolunteers: number
  generalTeachers: number
  educatedTeachers: number
  instructors: number
}

const EMPTY_METRICS: PivotMetrics = {
  schoolCount: 0,
  educationHours: 0,
  classCount: 0,
  male: 0,
  female: 0,
  totalParticipants: 0,
  generalVolunteers: 0,
  staffVolunteers: 0,
  returningVolunteers: 0,
  generalTeachers: 0,
  educatedTeachers: 0,
  instructors: 0,
}

export type PivotExportRow =
  | { kind: 'category'; label: string }
  | { kind: 'detail'; label: string; metrics: PivotMetrics }
  | { kind: 'subtotal'; label: string; metrics: PivotMetrics }
  | { kind: 'grand'; label: string; metrics: PivotMetrics }

function sumClassCount(row: EducationRecordRow): number {
  return row.classCount ?? 0
}

function pivotBucket(row: EducationRecordRow): PivotBucket {
  const t = row.targetLevel
  if (t === 'elementary' || t === 'middle' || t === 'high' || t === 'university' || t === 'adult') {
    return t
  }
  return 'unknown'
}

function getCategoryLabel(row: EducationRecordRow): string {
  const raw = (row.businessArea ?? '').trim()
  if (KNOWN_BUSINESS_AREAS.has(raw)) return raw
  return '(비어 있음)'
}

function metricsFromRows(rows: EducationRecordRow[]): PivotMetrics {
  if (rows.length === 0) return { ...EMPTY_METRICS }

  const schoolKeys = new Set<string>()
  for (const row of rows) {
    schoolKeys.add(
      row.schoolId != null && row.schoolId !== ''
        ? String(row.schoolId)
        : row.schoolOrOrganizationName?.trim()
          ? `__school:${row.schoolOrOrganizationName}`
          : `__row:${row.id}`
    )
  }

  return {
    schoolCount: schoolKeys.size,
    educationHours: rows.reduce((s, row) => s + (row.educationHours ?? 0), 0),
    classCount: rows.reduce((s, row) => s + sumClassCount(row), 0),
    male: rows.reduce((s, row) => s + (row.maleParticipants ?? 0), 0),
    female: rows.reduce((s, row) => s + (row.femaleParticipants ?? 0), 0),
    totalParticipants: rows.reduce((s, row) => s + (row.totalParticipants ?? 0), 0),
    generalVolunteers: rows.reduce((s, row) => s + (row.generalVolunteers ?? 0), 0),
    staffVolunteers: rows.reduce((s, row) => s + (row.staffVolunteers ?? 0), 0),
    returningVolunteers: rows.reduce((s, row) => s + (row.returningVolunteers ?? 0), 0),
    generalTeachers: rows.reduce((s, row) => s + (row.generalTeachers ?? 0), 0),
    educatedTeachers: rows.reduce((s, row) => s + (row.educatedTeachers ?? 0), 0),
    instructors: rows.reduce((s, row) => s + (row.instructors ?? 0), 0),
  }
}

/** 엑셀 B열부터 12개 숫자 (행 레이블 제외) */
export function metricsToNumericCells(m: PivotMetrics): number[] {
  return [
    m.schoolCount,
    m.educationHours,
    m.classCount,
    m.male,
    m.female,
    m.totalParticipants,
    m.generalVolunteers,
    m.staffVolunteers,
    m.returningVolunteers,
    m.generalTeachers,
    m.educatedTeachers,
    m.instructors,
  ]
}

const CATEGORY_ORDER: { label: string; detailTargets: readonly TargetLevel[] }[] = [
  { label: '경제금융', detailTargets: TARGET_ORDER_FIVE },
  { label: '진로취업', detailTargets: TARGET_ORDER_FIVE },
  { label: '기업가정신', detailTargets: TARGET_ORDER_FIVE },
  { label: '디지털리터러시', detailTargets: TARGET_ORDER_DIGITAL },
  { label: '(비어 있음)', detailTargets: TARGET_ORDER_FIVE },
]

/**
 * 필터된 실적 목록으로 피벗형 합계 시트 본문 행을 생성한다.
 */
export function buildPivotExportRows(rows: EducationRecordRow[]): PivotExportRow[] {
  const byCategory = new Map<string, EducationRecordRow[]>()
  for (const cat of CATEGORY_ORDER) {
    byCategory.set(cat.label, [])
  }
  for (const row of rows) {
    const label = getCategoryLabel(row)
    const bucket = byCategory.get(label)
    if (bucket) bucket.push(row)
    else {
      const fallback = byCategory.get('(비어 있음)')
      if (fallback) fallback.push(row)
    }
  }

  const result: PivotExportRow[] = []

  for (const { label: catLabel, detailTargets } of CATEGORY_ORDER) {
    const inCategory = byCategory.get(catLabel) ?? []

    result.push({ kind: 'category', label: catLabel })

    const byBucket = new Map<PivotBucket, EducationRecordRow[]>()
    for (const t of detailTargets) byBucket.set(t, [])
    byBucket.set('unknown', [])

    for (const row of inCategory) {
      const b = pivotBucket(row)
      if (b === 'unknown') {
        byBucket.get('unknown')!.push(row)
      } else if (detailTargets.includes(b as (typeof detailTargets)[number])) {
        byBucket.get(b)!.push(row)
      } else {
        byBucket.get('unknown')!.push(row)
      }
    }

    for (const t of detailTargets) {
      const list = byBucket.get(t) ?? []
      result.push({
        kind: 'detail',
        label: `  ${TARGET_LABEL[t]}`,
        metrics: metricsFromRows(list),
      })
    }

    const unknownList = byBucket.get('unknown') ?? []
    if (unknownList.length > 0) {
      result.push({
        kind: 'detail',
        label: '  (구분 없음)',
        metrics: metricsFromRows(unknownList),
      })
    }

    result.push({
      kind: 'subtotal',
      label: '  합계',
      metrics: metricsFromRows(inCategory),
    })
  }

  result.push({
    kind: 'grand',
    label: '총합계',
    metrics: metricsFromRows(rows),
  })

  return result
}
