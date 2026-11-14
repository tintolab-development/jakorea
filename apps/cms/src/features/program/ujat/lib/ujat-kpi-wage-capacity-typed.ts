import type { Program } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { listUjatEducationRegionsActive } from '@/features/program/ujat/lib/ujat-education-regions'
import {
  EMPTY_UJAT_REGION_CAPACITY_BY_SEMESTER,
  UJAT_REGION_CAPACITY_OVERLAY_KEY,
  type UjatRegionCapacityBySemesterState,
  type UjatRegionCapacitySemesterValues,
} from '@/features/program/ujat/lib/ujat-region-capacity-types'
import {
  UJAT_WAGE_OVERLAY_PAYMENT_KEY,
  resolveUjatWageDeductionLabel,
  ujatPaymentItemLabelsFromIds,
} from '@/features/program/ujat/lib/ujat-wage-info-display'
import type { UjatRegionCapacityUpsert } from '@/features/program/ujat/api/region-capacities-client'

export const UJAT_KPI_OVERLAY_KEYS = [
  'ujat.kpi.participantCount',
  'ujat.kpi.instructor',
  'ujat.kpi.volunteer',
  'ujat.kpi.dispatchedSchool',
  'ujat.kpi.dispatchedClass',
] as const

export function isUjatKpiWageCapacityOverlayKey(key: string): boolean {
  return (
    key.startsWith('ujat.kpi.') ||
    key === UJAT_WAGE_OVERLAY_PAYMENT_KEY ||
    key === UJAT_REGION_CAPACITY_OVERLAY_KEY
  )
}

export function stripUjatKpiWageCapacityOverlay(
  overlay: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(overlay).filter(([key]) => !isUjatKpiWageCapacityOverlayKey(key))
  )
}

function overlayNumber(overlay: Record<string, unknown>, key: string): number | null | undefined {
  if (!Object.prototype.hasOwnProperty.call(overlay, key)) return undefined
  const value = overlay[key]
  if (value == null) return null
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function overlayPaymentItemIds(overlay: Record<string, unknown>): string[] | undefined {
  if (!Object.prototype.hasOwnProperty.call(overlay, UJAT_WAGE_OVERLAY_PAYMENT_KEY)) {
    return undefined
  }
  const raw = overlay[UJAT_WAGE_OVERLAY_PAYMENT_KEY]
  if (!Array.isArray(raw)) return []
  return raw.filter((item): item is string => typeof item === 'string')
}

function overlayRegionCapacity(
  overlay: Record<string, unknown>
): UjatRegionCapacityBySemesterState | undefined {
  const raw = overlay[UJAT_REGION_CAPACITY_OVERLAY_KEY]
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const row = raw as Partial<UjatRegionCapacityBySemesterState> & {
    first?: UjatRegionCapacitySemesterValues
    second?: UjatRegionCapacitySemesterValues
  }
  return {
    h1: { ...(row.h1 ?? row.first ?? {}) },
    h2: { ...(row.h2 ?? row.second ?? {}) },
  }
}

/** Draft migration boundary only. Do not write the result back into Overlay Store. */
export function ujatKpiWageCapacityFromLegacyOverlay(
  overlay: Record<string, unknown>
): Pick<
  ProgramDetailEditFormValues,
  | 'kpiFinalParticipants'
  | 'kpiInstructorCount'
  | 'kpiVolunteerCount'
  | 'kpiFinalSchools'
  | 'kpiFinalClasses'
  | 'wagePaymentItemIds'
  | 'ujatRegionCapacity'
> {
  return {
    kpiFinalParticipants: overlayNumber(overlay, 'ujat.kpi.participantCount') ?? undefined,
    kpiInstructorCount: overlayNumber(overlay, 'ujat.kpi.instructor') ?? undefined,
    kpiVolunteerCount: overlayNumber(overlay, 'ujat.kpi.volunteer') ?? undefined,
    kpiFinalSchools: overlayNumber(overlay, 'ujat.kpi.dispatchedSchool') ?? undefined,
    kpiFinalClasses: overlayNumber(overlay, 'ujat.kpi.dispatchedClass') ?? undefined,
    wagePaymentItemIds: overlayPaymentItemIds(overlay),
    ujatRegionCapacity: overlayRegionCapacity(overlay),
  }
}

/** 빈 칸은 null — 0은 「배정 불가」로 동작하므로 빈 칸을 0으로 바꾸지 않는다. */
function countFromInput(raw: string | undefined): number | null {
  const trimmed = raw?.trim()
  if (!trimmed) return null
  const parsed = Number.parseInt(trimmed, 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

const UJAT_REGION_CAPACITY_HALVES = [
  ['FIRST_HALF', 'h1'],
  ['SECOND_HALF', 'h2'],
] as const

/** 활성 지역 중 학급 수 또는 봉사자 수가 비어 있는 칸 — 등록 위저드와 같은 `capacity.{half}.{지역}` 키 */
export function listIncompleteUjatRegionCapacityKeys(
  state: UjatRegionCapacityBySemesterState | undefined
): string[] {
  const values = state ?? EMPTY_UJAT_REGION_CAPACITY_BY_SEMESTER
  const regions = listUjatEducationRegionsActive()
  return UJAT_REGION_CAPACITY_HALVES.flatMap(([, half]) =>
    regions
      .filter(region => {
        const row = values[half]?.[region.label]
        return countFromInput(row?.classCount) == null || countFromInput(row?.volunteerCount) == null
      })
      .map(region => `capacity.${half}.${region.label}`)
  )
}

export class UjatRegionCapacityIncompleteError extends Error {
  readonly incompleteKeys: readonly string[]

  constructor(incompleteKeys: readonly string[]) {
    super('UJAT_REGION_CAPACITY_INCOMPLETE')
    this.name = 'UjatRegionCapacityIncompleteError'
    this.incompleteKeys = incompleteKeys
  }
}

/**
 * PUT region-capacities payload. PUT은 전체 교체이고 maxClassCount·maxVolunteerCount 둘 다 필수(null은 400)라서
 * 활성 지역에 빈 칸이 하나라도 있으면 payload를 만들지 않는다.
 */
export function ujatRegionCapacityUpsertsFromState(
  state: UjatRegionCapacityBySemesterState | undefined
): UjatRegionCapacityUpsert[] {
  const values = state ?? EMPTY_UJAT_REGION_CAPACITY_BY_SEMESTER
  const regions = listUjatEducationRegionsActive()
  const upserts: UjatRegionCapacityUpsert[] = []
  const incompleteKeys: string[] = []
  for (const [semesterType, half] of UJAT_REGION_CAPACITY_HALVES) {
    for (const region of regions) {
      const row = values[half]?.[region.label]
      const maxClassCount = countFromInput(row?.classCount)
      const maxVolunteerCount = countFromInput(row?.volunteerCount)
      if (maxClassCount == null || maxVolunteerCount == null) {
        incompleteKeys.push(`capacity.${half}.${region.label}`)
        continue
      }
      upserts.push({ semesterType, educationRegionCode: region.key, maxClassCount, maxVolunteerCount })
    }
  }
  if (incompleteKeys.length > 0) throw new UjatRegionCapacityIncompleteError(incompleteKeys)
  return upserts
}

/** 변경 여부 비교용 — 활성 지역의 입력값만, 빈 칸은 null로 둔다(payload를 만들지 않음). */
export function ujatRegionCapacityStateSnapshot(
  state: UjatRegionCapacityBySemesterState | undefined
): string {
  const values = state ?? EMPTY_UJAT_REGION_CAPACITY_BY_SEMESTER
  const regions = listUjatEducationRegionsActive()
  return JSON.stringify(
    UJAT_REGION_CAPACITY_HALVES.flatMap(([semesterType, half]) =>
      regions.map(region => [
        semesterType,
        region.key,
        countFromInput(values[half]?.[region.label]?.classCount),
        countFromInput(values[half]?.[region.label]?.volunteerCount),
      ])
    )
  )
}

export function applyUjatKpiWageCapacityFromFormValues(
  program: Program,
  values?: Partial<ProgramDetailEditFormValues>
): Program {
  if (values == null) return program
  const existingKpi = program.generalCommonInfo?.kpi
  const kpi = {
    finalParticipants: values.kpiFinalParticipants ?? existingKpi?.finalParticipants ?? 0,
    instructorCount: values.kpiInstructorCount ?? existingKpi?.instructorCount ?? 0,
    volunteerCount: values.kpiVolunteerCount ?? existingKpi?.volunteerCount ?? 0,
    finalSchools: values.kpiFinalSchools ?? existingKpi?.finalSchools ?? 0,
    finalClasses: values.kpiFinalClasses ?? existingKpi?.finalClasses ?? 0,
  }
  const paymentItemIds = values.wagePaymentItemIds
  const ips =
    values.ipsCategory === 'inspire'
      ? 'Inspire'
      : values.ipsCategory === 'succeed'
        ? 'Succeed'
        : values.ipsCategory === 'prepare'
          ? 'Prepare'
          : program.ips
  return {
    ...program,
    ...(ips != null ? { ips } : {}),
    ...(values.kpiFinalParticipants !== undefined
      ? {
          totalParticipants: values.kpiFinalParticipants ?? undefined,
          approvedStudentCount: values.kpiFinalParticipants ?? undefined,
        }
      : {}),
    ...(values.kpiVolunteerCount !== undefined
      ? { generalVolunteers: values.kpiVolunteerCount ?? undefined }
      : {}),
    ...(values.kpiFinalSchools !== undefined
      ? { participatingSchoolCount: values.kpiFinalSchools ?? undefined }
      : {}),
    ...(values.ujatRegionCapacity != null
      ? { ujatRegionCapacity: cloneUjatRegionCapacityState(values.ujatRegionCapacity) }
      : {}),
    generalCommonInfo: {
      ...program.generalCommonInfo,
      kpi,
      ...(paymentItemIds != null
        ? {
            paymentItems: ujatPaymentItemLabelsFromIds(paymentItemIds),
            deductionItems: resolveUjatWageDeductionLabel(paymentItemIds),
          }
        : {}),
    },
  }
}

export function cloneUjatRegionCapacityState(
  state:
    | UjatRegionCapacityBySemesterState
    | {
        h1?: Record<string, { classCount?: string; volunteerCount?: string } | undefined>
        h2?: Record<string, { classCount?: string; volunteerCount?: string } | undefined>
      }
    | undefined
): UjatRegionCapacityBySemesterState {
  const compact = (
    raw: Record<string, { classCount?: string; volunteerCount?: string } | undefined> | undefined
  ): UjatRegionCapacitySemesterValues => {
    const next: UjatRegionCapacitySemesterValues = {}
    for (const [key, value] of Object.entries(raw ?? {})) {
      if (value != null) next[key] = value
    }
    return next
  }
  return {
    h1: compact(state?.h1),
    h2: compact(state?.h2),
  }
}
