/**
 * GET/PUT /api/admin/program-execution/programs/{programId}/ujat/planning-estimates
 * PUT은 프로그램 전체 교체(DELETE+INSERT)이므로 다른 지역·학기 행을 병합해 전송한다.
 */

import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'

export type UjatPlanningEstimateSemesterKey = 'h1' | 'h2'
export type UjatPlanningEstimateSemesterType = 'FIRST_HALF' | 'SECOND_HALF'

type PlanningEstimateRegionInputs = {
  estimation: Record<
    UjatPlanningEstimateSemesterKey,
    { maxClassesPerDay: string; expectedVolunteerCount: string }
  >
}

export type UjatPlanningEstimateRequest = {
  semesterType: UjatPlanningEstimateSemesterType | string
  educationRegionCode: string
  maxClassesPerDay: number
  expectedVolunteerCount: number
}

export type UjatPlanningEstimateStatus = {
  programId?: number
  semesterType?: string
  educationRegionCode?: string
  educationRegionName?: string
  maxClassesPerDay?: number
  totalClassCount?: number
  expectedVolunteerCount?: number
  /** BE: volunteers <= 0 → null, else (totalClassCount * 2.0) / volunteers (no round) */
  volunteerEducationDayCount?: number | null
}

export type UjatPlanningEstimateUpsertRequest = {
  estimates: UjatPlanningEstimateRequest[]
}

const SEMESTER_TO_API: Record<UjatPlanningEstimateSemesterKey, UjatPlanningEstimateSemesterType> = {
  h1: 'FIRST_HALF',
  h2: 'SECOND_HALF',
}

function executionPath(programId: string, suffix: string): string {
  return `/api/admin/program-execution/programs/${encodeURIComponent(programId)}${suffix}`
}

function asEstimateList(
  payload: UjatPlanningEstimateStatus[] | { estimates?: UjatPlanningEstimateStatus[] } | null | undefined
): UjatPlanningEstimateStatus[] {
  if (Array.isArray(payload)) return payload
  if (payload && Array.isArray(payload.estimates)) return payload.estimates
  return []
}

export function toPlanningEstimateSemesterType(
  key: UjatPlanningEstimateSemesterKey
): UjatPlanningEstimateSemesterType {
  return SEMESTER_TO_API[key]
}

export function fromPlanningEstimateSemesterType(
  raw: string | null | undefined
): UjatPlanningEstimateSemesterKey | null {
  const value = String(raw ?? '')
    .trim()
    .toUpperCase()
  if (value === 'FIRST_HALF' || value === 'H1' || value === '1') return 'h1'
  if (value === 'SECOND_HALF' || value === 'H2' || value === '2') return 'h2'
  return null
}

function nonNegativeInt(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(n) || n < 0) return fallback
  return Math.trunc(n)
}

export async function fetchUjatPlanningEstimates(
  programId: string
): Promise<UjatPlanningEstimateStatus[]> {
  return asEstimateList(
    await unwrapApiBody(
      await customInstance({
        url: executionPath(programId, '/ujat/planning-estimates'),
        method: 'GET',
      })
    )
  )
}

export async function replaceUjatPlanningEstimates(
  programId: string,
  body: UjatPlanningEstimateUpsertRequest
): Promise<UjatPlanningEstimateStatus[]> {
  return asEstimateList(
    await unwrapApiBody(
      await customInstance({
        url: executionPath(programId, '/ujat/planning-estimates'),
        method: 'PUT',
        data: body,
      })
    )
  )
}

/** 서버 산정 입력값을 지역 draft에 반영. maxClassesPerDay·봉사단 수는 학기별 독립. */
export function applyPlanningEstimatesToRegionState<T extends PlanningEstimateRegionInputs>(
  state: T,
  estimates: readonly UjatPlanningEstimateStatus[],
  educationRegionCode: string
): T {
  const region = educationRegionCode.trim().toUpperCase()
  const matched = estimates.filter(
    row => String(row.educationRegionCode ?? '').trim().toUpperCase() === region
  )
  if (matched.length === 0) return state

  const estimation = {
    h1: { ...state.estimation.h1 },
    h2: { ...state.estimation.h2 },
  }

  for (const row of matched) {
    const semester = fromPlanningEstimateSemesterType(row.semesterType)
    if (!semester) continue
    const next = { ...estimation[semester] }
    if (typeof row.maxClassesPerDay === 'number' && Number.isFinite(row.maxClassesPerDay)) {
      next.maxClassesPerDay = String(Math.trunc(row.maxClassesPerDay))
    }
    if (
      typeof row.expectedVolunteerCount === 'number' &&
      Number.isFinite(row.expectedVolunteerCount)
    ) {
      next.expectedVolunteerCount = String(Math.trunc(row.expectedVolunteerCount))
    }
    estimation[semester] = next
  }

  return {
    ...state,
    estimation,
  }
}

/**
 * PUT 전체 교체용 병합.
 * 현재 지역 1·2학기는 UI 학기별 값으로 덮어쓰고, 그 외 지역·학기는 GET 결과를 보존한다.
 */
export function buildMergedPlanningEstimatePutBody(params: {
  existing: readonly UjatPlanningEstimateStatus[]
  educationRegionCode: string
  regionState: PlanningEstimateRegionInputs
}): UjatPlanningEstimateUpsertRequest {
  const region = params.educationRegionCode.trim().toUpperCase()
  const currentRows: UjatPlanningEstimateRequest[] = (['h1', 'h2'] as const).map(semester => ({
    semesterType: toPlanningEstimateSemesterType(semester),
    educationRegionCode: region,
    maxClassesPerDay: nonNegativeInt(params.regionState.estimation[semester].maxClassesPerDay, 0),
    expectedVolunteerCount: nonNegativeInt(
      params.regionState.estimation[semester].expectedVolunteerCount,
      0
    ),
  }))

  const preserved: UjatPlanningEstimateRequest[] = []
  for (const row of params.existing) {
    const code = String(row.educationRegionCode ?? '').trim().toUpperCase()
    if (!code || code === region) continue
    const semester = fromPlanningEstimateSemesterType(row.semesterType)
    if (!semester) continue
    preserved.push({
      semesterType: toPlanningEstimateSemesterType(semester),
      educationRegionCode: code,
      maxClassesPerDay: nonNegativeInt(row.maxClassesPerDay, 0),
      expectedVolunteerCount: nonNegativeInt(row.expectedVolunteerCount, 0),
    })
  }

  return { estimates: [...preserved, ...currentRows] }
}
