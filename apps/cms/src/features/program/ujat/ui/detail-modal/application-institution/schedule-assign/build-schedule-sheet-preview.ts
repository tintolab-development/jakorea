import {
  findUjatEducationRegionKeyByCode,
  listUjatEducationRegionsActive,
} from '@/features/program/ujat/lib/ujat-education-regions'
import {
  isoDateFromScheduleInstant,
  type UjatOrganizationScheduleSlotResponse,
} from '@/features/program/ujat/api/temporary-schedule-api'
import type {
  UjatInstitutionApplicationRegionKey,
} from '../list/regions'
import type { UjatInstitutionApplicationRow } from '../list/types'
import {
  collectPreferredEducationIsoDates,
  formatScheduleColumnTitle,
} from '../education-schedule'
import { formatAssignedGradeClassesDisplay } from './format-assigned-grade-classes'
import {
  getUjatScheduleAssignDraftRegionState,
  getUjatScheduleAssignRegionState,
} from './store'
import { gradeClassValueFromSlot } from './temporary-schedule-mapper'

export type ScheduleSheetPreviewColumn = {
  isoDate: string
  dateTitle: string
  institutionName: string
  gradeClassLines: string[]
  totalClassCount: number
}

export type ScheduleSheetPreviewDateGroup = {
  isoDate: string
  dateTitle: string
  columns: ScheduleSheetPreviewColumn[]
}

export type ScheduleSheetPreviewRegion = {
  regionKey: UjatInstitutionApplicationRegionKey
  regionLabel: string
  columns: ScheduleSheetPreviewColumn[]
}

/** 동일 날짜 연속 열을 그룹 — 시안 날짜 헤더 colSpan / 엑셀 merge용 */
export function groupScheduleSheetPreviewColumnsByDate(
  columns: readonly ScheduleSheetPreviewColumn[]
): ScheduleSheetPreviewDateGroup[] {
  const groups: ScheduleSheetPreviewDateGroup[] = []
  for (const column of columns) {
    const last = groups[groups.length - 1]
    if (last && last.isoDate === column.isoDate) {
      last.columns.push(column)
      continue
    }
    groups.push({
      isoDate: column.isoDate,
      dateTitle: column.dateTitle,
      columns: [column],
    })
  }
  return groups
}

const EMPTY_PLACEHOLDER = '-'

function createEmptyDateColumn(isoDate: string, dateTitle: string): ScheduleSheetPreviewColumn {
  return {
    isoDate,
    dateTitle,
    institutionName: EMPTY_PLACEHOLDER,
    gradeClassLines: [],
    totalClassCount: 0,
  }
}

/** 시안: 배정 기관이 1건 이상 있는 지역만 섹션 노출 */
export function regionHasScheduleSheetAssignments(
  region: Pick<ScheduleSheetPreviewRegion, 'columns'>
): boolean {
  return region.columns.some(column => column.totalClassCount > 0)
}

function displayInstitutionName(
  slotName: string | null | undefined,
  applicationName: string | null | undefined
): string {
  const fromSlot = slotName?.trim()
  if (fromSlot) return fromSlot
  const fromApp = applicationName?.trim()
  if (fromApp && fromApp !== '-') return fromApp
  return EMPTY_PLACEHOLDER
}

function resolveSlotIsoDate(
  slot: UjatOrganizationScheduleSlotResponse,
  isoByScheduleId: ReadonlyMap<number, string>
): string | null {
  const fromStart = isoDateFromScheduleInstant(slot.scheduleStartAt)
  if (fromStart) return fromStart
  if (slot.scheduleId == null) return null
  return isoByScheduleId.get(Number(slot.scheduleId)) ?? null
}

function resolveSlotRegionKey(
  slot: UjatOrganizationScheduleSlotResponse,
  applicationRegionKey: string | undefined
): string {
  return (
    findUjatEducationRegionKeyByCode(slot.educationRegionCode) ??
    findUjatEducationRegionKeyByCode(applicationRegionKey) ??
    applicationRegionKey?.trim() ??
    'seoul'
  )
}

/**
 * remote `organization-schedule-assignments` → 지역별 CrossTable 열.
 * 희망일(O)이 있으면 배정 없는 날짜도 `-` 열로 유지. 슬롯의 organizationName을 canonical로 쓴다.
 * hydrate와 동일하게 `scheduleStartAt`이 없으면 `scheduleId`로 날짜를 복원한다.
 */
export function buildScheduleSheetPreviewFromAssignments(input: {
  slots: readonly UjatOrganizationScheduleSlotResponse[]
  applicationRows: readonly UjatInstitutionApplicationRow[]
  /** iso ← scheduleId (프로그램 하루 일정). scheduleStartAt 누락 슬롯 복원용 */
  scheduleIdByIsoDate?: ReadonlyMap<string, number>
}): ScheduleSheetPreviewRegion[] {
  const rowById = new Map(input.applicationRows.map(row => [row.id, row]))
  const isoByScheduleId = new Map<number, string>()
  if (input.scheduleIdByIsoDate) {
    for (const [iso, scheduleId] of input.scheduleIdByIsoDate) {
      isoByScheduleId.set(scheduleId, iso)
    }
  }
  const preferredByRegion = new Map<string, string[]>()
  for (const region of listUjatEducationRegionsActive()) {
    const regionRows = input.applicationRows.filter(row => row.regionKey === region.key)
    preferredByRegion.set(region.key, collectPreferredEducationIsoDates(regionRows))
  }

  const slotsByRegionIsoApp = new Map<
    string,
    Map<string, Map<string, UjatOrganizationScheduleSlotResponse[]>>
  >()

  for (const slot of input.slots) {
    const appId =
      slot.organizationApplicationId != null ? String(slot.organizationApplicationId) : null
    if (!appId) continue
    const iso = resolveSlotIsoDate(slot, isoByScheduleId)
    if (!iso) continue
    const regionKey = resolveSlotRegionKey(slot, rowById.get(appId)?.regionKey)
    let byIso = slotsByRegionIsoApp.get(regionKey)
    if (!byIso) {
      byIso = new Map()
      slotsByRegionIsoApp.set(regionKey, byIso)
    }
    let byApp = byIso.get(iso)
    if (!byApp) {
      byApp = new Map()
      byIso.set(iso, byApp)
    }
    const list = byApp.get(appId) ?? []
    list.push(slot)
    byApp.set(appId, list)
  }

  return listUjatEducationRegionsActive()
    .map(region => {
      const regionKey = region.key as UjatInstitutionApplicationRegionKey
      const byIso = slotsByRegionIsoApp.get(regionKey) ?? new Map()
      const preferred = preferredByRegion.get(regionKey) ?? []
      const isoDates = [...new Set([...preferred, ...byIso.keys()])].sort()
      const columns: ScheduleSheetPreviewColumn[] = []

      for (const isoDate of isoDates) {
        const title = formatScheduleColumnTitle(isoDate)
        const byApp = byIso.get(isoDate)
        const assignmentEntries: ScheduleSheetPreviewColumn[] = []

        if (byApp) {
          const appIds = [...byApp.keys()].sort((a, b) => {
            const nameA = displayInstitutionName(
              byApp.get(a)?.[0]?.organizationName,
              rowById.get(a)?.institutionName
            )
            const nameB = displayInstitutionName(
              byApp.get(b)?.[0]?.organizationName,
              rowById.get(b)?.institutionName
            )
            return nameA.localeCompare(nameB, 'ko')
          })

          for (const appId of appIds) {
            const appSlots = byApp.get(appId) ?? []
            if (appSlots.length === 0) continue
            const institution = rowById.get(appId)
            const gradeValues: string[] = []
            for (const slot of appSlots) {
              const value = gradeClassValueFromSlot(slot)
              if (value != null && !gradeValues.includes(value)) gradeValues.push(value)
            }
            assignmentEntries.push({
              isoDate,
              dateTitle: title,
              institutionName: displayInstitutionName(
                appSlots[0]?.organizationName,
                institution?.institutionName
              ),
              gradeClassLines: formatAssignedGradeClassesDisplay(
                gradeValues,
                institution?.gradeClassCounts ?? []
              ),
              totalClassCount: gradeValues.length,
            })
          }
        }

        if (assignmentEntries.length === 0) {
          columns.push(createEmptyDateColumn(isoDate, title))
        } else {
          columns.push(...assignmentEntries)
        }
      }

      return {
        regionKey,
        regionLabel: region.label,
        columns,
      }
    })
    .filter(regionHasScheduleSheetAssignments)
}

/** API 결과 + 로컬 저장본을 지역 단위로 합친다. API에 없는 지역만 로컬로 보완. */
export function mergeScheduleSheetPreviewRegions(
  primary: readonly ScheduleSheetPreviewRegion[],
  fallback: readonly ScheduleSheetPreviewRegion[]
): ScheduleSheetPreviewRegion[] {
  if (fallback.length === 0) return [...primary]
  if (primary.length === 0) return [...fallback]
  const byKey = new Map(primary.map(region => [region.regionKey, region]))
  for (const region of fallback) {
    if (!byKey.has(region.regionKey)) byKey.set(region.regionKey, region)
  }
  return listUjatEducationRegionsActive()
    .map(region => byKey.get(region.key as UjatInstitutionApplicationRegionKey))
    .filter((region): region is ScheduleSheetPreviewRegion => region != null)
}

/** 편집 중(draft)에 학급 배정이 있는지 — 미저장 empty 안내 구분용 */
export function hasDraftScheduleSheetAssignments(): boolean {
  for (const region of listUjatEducationRegionsActive()) {
    const draft = getUjatScheduleAssignDraftRegionState(
      region.key as UjatInstitutionApplicationRegionKey
    )
    for (const day of Object.values(draft.days)) {
      if (day.rows.some(row => row.institutionRowId && row.gradeValues.length > 0)) {
        return true
      }
    }
  }
  return false
}

/** mock / 로컬 저장본 기반 — remote OFF 또는 API 보완용 */
export function buildScheduleSheetPreview(
  applicationRows: readonly UjatInstitutionApplicationRow[]
): ScheduleSheetPreviewRegion[] {
  const rowById = new Map(applicationRows.map(row => [row.id, row]))

  return listUjatEducationRegionsActive()
    .map(region => {
      const regionKey = region.key as UjatInstitutionApplicationRegionKey
      const state = getUjatScheduleAssignRegionState(regionKey)
      const columns: ScheduleSheetPreviewColumn[] = []

      for (const isoDate of Object.keys(state.days).sort()) {
        const title = formatScheduleColumnTitle(isoDate)
        const day = state.days[isoDate]
        const assignmentEntries: ScheduleSheetPreviewColumn[] = []

        if (day) {
          for (const assignRow of day.rows) {
            if (assignRow.institutionRowId == null) continue
            const institution = rowById.get(assignRow.institutionRowId)
            if (!institution) continue

            assignmentEntries.push({
              isoDate,
              dateTitle: title,
              institutionName: institution.institutionName,
              gradeClassLines: formatAssignedGradeClassesDisplay(
                assignRow.gradeValues,
                institution.gradeClassCounts
              ),
              totalClassCount: assignRow.gradeValues.length,
            })
          }
        }

        if (assignmentEntries.length === 0) {
          columns.push(createEmptyDateColumn(isoDate, title))
        } else {
          columns.push(...assignmentEntries)
        }
      }

      return {
        regionKey,
        regionLabel: region.label,
        columns,
      }
    })
    .filter(regionHasScheduleSheetAssignments)
}

export { EMPTY_PLACEHOLDER as SCHEDULE_SHEET_EMPTY_PLACEHOLDER }
