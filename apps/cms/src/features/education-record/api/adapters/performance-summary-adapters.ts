/**
 * 실적 관리 합계 탭 — API SummarySection / TargetTotal → UI SummaryRow
 */

import {
  SUMMARY_CATEGORIES,
  type SummaryCategoryMeta,
} from '@/features/education-record/model/education-record-summary-config'
import { SUMMARY_EMPTY_ROW } from '@/features/education-record/model/education-record-summary-mock'
import type {
  EducationRecordRow,
  SummaryCategoryKey,
  SummaryRow,
  SummarySubRowKey,
} from '@/features/education-record/model/education-record-types'
import type {
  PerformanceStatsFrontendResponse,
  SummarySection,
  TargetTotal,
} from '@/shared/api/generated/performance/schemas'

export type SummaryTabView = {
  byCategory: Record<SummaryCategoryKey, Partial<Record<SummarySubRowKey, SummaryRow>>>
  grandTotal: SummaryRow
}

const BUSINESS_AREA_TO_CATEGORY: Record<string, SummaryCategoryKey> = {
  경제금융: 'economyFinance',
  진로취업: 'careerEmployment',
  기업가정신: 'entrepreneurship',
  디지털리터러시: 'digitalLiteracy',
  economyfinance: 'economyFinance',
  careeremployment: 'careerEmployment',
  entrepreneurship: 'entrepreneurship',
  digitalliteracy: 'digitalLiteracy',
}

const CATEGORY_LABEL: Record<SummaryCategoryKey, string> = {
  economyFinance: '경제금융',
  careerEmployment: '진로취업',
  entrepreneurship: '기업가정신',
  digitalLiteracy: '디지털리터러시',
}

function emptyCategoryBucket(): Partial<Record<SummarySubRowKey, SummaryRow>> {
  return {}
}

function createEmptyView(): SummaryTabView {
  return {
    byCategory: {
      economyFinance: emptyCategoryBucket(),
      careerEmployment: emptyCategoryBucket(),
      entrepreneurship: emptyCategoryBucket(),
      digitalLiteracy: emptyCategoryBucket(),
    },
    grandTotal: { ...SUMMARY_EMPTY_ROW },
  }
}

function num(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

export function mapTargetTotalToSummaryRow(dto?: TargetTotal | null): SummaryRow {
  if (!dto) return { ...SUMMARY_EMPTY_ROW }
  return {
    schoolCount: num(dto.schoolCount),
    classCount: num(dto.classCount),
    participants: num(dto.totalParticipants),
    educationHours: num(dto.educationHours),
    generalVolunteers: num(dto.generalVolunteerCount),
    staffVolunteers: num(dto.employeeVolunteerCount),
    generalTeachers: num(dto.generalTeacherCount),
    educatedTeachers: num(dto.trainedTeacherCount),
    instructors: num(dto.instructorCount),
  }
}

export function resolveSummaryCategoryKey(businessArea?: string): SummaryCategoryKey | null {
  const raw = (businessArea ?? '').trim()
  if (!raw) return null
  const direct = BUSINESS_AREA_TO_CATEGORY[raw]
  if (direct) return direct
  const compact = raw.replace(/[\s_-]/g, '').toLowerCase()
  return BUSINESS_AREA_TO_CATEGORY[compact] ?? null
}

export function resolveSummarySubRowKey(targetLevel?: string): SummarySubRowKey | null {
  const raw = (targetLevel ?? '').trim().toLowerCase()
  if (!raw) return null
  if (raw === 'elementary' || raw === '초' || raw.includes('초등')) return 'elementary'
  if (raw === 'middle' || raw === '중' || raw.includes('중등') || raw.includes('중학교')) {
    return 'middle'
  }
  if (raw === 'high' || raw === '고' || raw.includes('고등')) return 'high'
  if (raw === 'university' || raw.includes('대학')) return 'university'
  if (raw === 'adult' || raw.includes('성인')) return 'adult'
  if (raw === 'total' || raw === '합계' || raw === '소계') return 'total'
  return null
}

function addRows(a: SummaryRow, b: SummaryRow): SummaryRow {
  return {
    schoolCount: a.schoolCount + b.schoolCount,
    classCount: a.classCount + b.classCount,
    participants: a.participants + b.participants,
    educationHours: a.educationHours + b.educationHours,
    generalVolunteers: a.generalVolunteers + b.generalVolunteers,
    staffVolunteers: a.staffVolunteers + b.staffVolunteers,
    generalTeachers: a.generalTeachers + b.generalTeachers,
    educatedTeachers: a.educatedTeachers + b.educatedTeachers,
    instructors: a.instructors + b.instructors,
  }
}

function applySectionToView(view: SummaryTabView, section: SummarySection): void {
  const categoryKey = resolveSummaryCategoryKey(section.businessArea)
  if (!categoryKey) return

  const bucket = view.byCategory[categoryKey]
  for (const row of section.rows ?? []) {
    const subKey = resolveSummarySubRowKey(row.targetLevel)
    if (!subKey || subKey === 'total') continue
    bucket[subKey] = mapTargetTotalToSummaryRow(row)
  }
  if (section.total) {
    bucket.total = mapTargetTotalToSummaryRow(section.total)
  } else {
    const category = SUMMARY_CATEGORIES.find(c => c.key === categoryKey)
    bucket.total = sumCategorySubRows(bucket, category)
  }
}

function sumCategorySubRows(
  bucket: Partial<Record<SummarySubRowKey, SummaryRow>>,
  category: SummaryCategoryMeta | undefined
): SummaryRow {
  let acc = { ...SUMMARY_EMPTY_ROW }
  if (!category) return acc
  for (const subKey of category.subRows) {
    if (subKey === 'total') continue
    const row = bucket[subKey]
    if (row) acc = addRows(acc, row)
  }
  return acc
}

/**
 * `GET /api/admin/performance/summary` 응답 → 합계 탭 뷰.
 * `sections`가 없으면 단일 businessArea/targetLevel 필드를 1섹션으로 취급한다.
 */
export function mapPerformanceStatsToSummaryTabView(
  dto: PerformanceStatsFrontendResponse | null | undefined
): SummaryTabView {
  const view = createEmptyView()
  if (!dto) return view

  const sections =
    dto.sections && dto.sections.length > 0
      ? dto.sections
      : dto.businessArea || dto.targetLevel
        ? [
            {
              businessArea: dto.businessArea,
              rows: dto.targetLevel
                ? [
                    {
                      targetLevel: dto.targetLevel,
                      schoolCount: dto.stats?.totalSchools,
                      totalParticipants: dto.stats?.totalStudents,
                      instructorCount: dto.stats?.totalInstructors,
                    },
                  ]
                : undefined,
              total: {
                schoolCount: dto.stats?.totalSchools,
                totalParticipants: dto.stats?.totalStudents,
                instructorCount: dto.stats?.totalInstructors,
              },
            } satisfies SummarySection,
          ]
        : []

  for (const section of sections) {
    applySectionToView(view, section)
  }

  view.grandTotal = SUMMARY_CATEGORIES.reduce((acc, category) => {
    const total = view.byCategory[category.key].total ?? SUMMARY_EMPTY_ROW
    return addRows(acc, total)
  }, { ...SUMMARY_EMPTY_ROW })

  return view
}

function pivotBucket(row: EducationRecordRow): SummarySubRowKey | null {
  return resolveSummarySubRowKey(row.targetLevel)
}

function metricsFromRows(rows: EducationRecordRow[]): SummaryRow {
  if (rows.length === 0) return { ...SUMMARY_EMPTY_ROW }
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
    classCount: rows.reduce((s, row) => s + (row.classCount ?? 0), 0),
    participants: rows.reduce((s, row) => s + (row.totalParticipants ?? 0), 0),
    educationHours: rows.reduce((s, row) => s + (row.educationHours ?? 0), 0),
    generalVolunteers: rows.reduce((s, row) => s + (row.generalVolunteers ?? 0), 0),
    staffVolunteers: rows.reduce((s, row) => s + (row.staffVolunteers ?? 0), 0),
    generalTeachers: rows.reduce((s, row) => s + (row.generalTeachers ?? 0), 0),
    educatedTeachers: rows.reduce((s, row) => s + (row.educatedTeachers ?? 0), 0),
    instructors: rows.reduce((s, row) => s + (row.instructors ?? 0), 0),
  }
}

/** mock / 목록 기반 합계 — 필터된 EducationRecordRow[] 집계 */
export function buildSummaryTabViewFromRows(rows: EducationRecordRow[]): SummaryTabView {
  const view = createEmptyView()

  for (const category of SUMMARY_CATEGORIES) {
    const label = CATEGORY_LABEL[category.key]
    const inCategory = rows.filter(row => (row.businessArea ?? '').trim() === label)
    const bucket = view.byCategory[category.key]

    for (const subKey of category.subRows) {
      if (subKey === 'total') continue
      const list = inCategory.filter(row => pivotBucket(row) === subKey)
      bucket[subKey] = metricsFromRows(list)
    }
    bucket.total = metricsFromRows(inCategory)
  }

  view.grandTotal = metricsFromRows(rows)
  return view
}

export function getSummaryRow(
  view: SummaryTabView,
  categoryKey: SummaryCategoryKey,
  subKey: SummarySubRowKey
): SummaryRow {
  return view.byCategory[categoryKey]?.[subKey] ?? SUMMARY_EMPTY_ROW
}
