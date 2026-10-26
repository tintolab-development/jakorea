import dayjs from 'dayjs'
import { formatShortYearMdWithKoreanWeekday } from '@/shared/lib/format-date-korean-weekday'
import {
  EMPTY_UJAT_HALF_EVENT_RANGE_SEAL,
  EMPTY_UJAT_HALF_MULTI_SCHEDULE_BUNDLE,
  UJAT_EDUCATION_DELIVERY_LABEL,
  type UjatEducationDelivery,
  type UjatHalfEventRangeSeal,
  type UjatHalfMultiScheduleBundle,
  type UjatHalfSemesterKey,
  type UjatTextbookEducationMode,
  ujatHalfScheduleOverlayKeys,
} from '@/features/program/ujat/lib/ujat-half-education-schedule-types'
import { getUjatEducationRegionLabel } from '@/features/program/ujat/lib/ujat-education-regions'
import { formatUjatEventRangeLabel } from '@/features/program/ujat/lib/ujat-education-schedule-settings-display'
import { resolveUjatRegistrationBasicInfoOverlay } from '@/features/program/ujat/lib/ujat-registration-basic-info-display'
import type {
  UjatTypedDetail,
  UjatTypedEducationStagePlan,
  UjatTypedHalfPlan,
  UjatTypedScheduleRow,
} from '@/features/program/ujat/api/typed-detail-client'

export type UjatHalfScheduleTableRow = {
  scheduleName: string
  scheduleText: string
  deliveryLabel: string
  textbookEducationLabel?: string
}

export type UjatHalfEducationScheduleDisplay = {
  preEducation: UjatHalfScheduleTableRow
  eventSchedule: UjatHalfScheduleTableRow
  closingCeremony: UjatHalfScheduleTableRow
}

function semesterForHalf(half: UjatHalfSemesterKey): 'FIRST_HALF' | 'SECOND_HALF' {
  return half === 'h1' ? 'FIRST_HALF' : 'SECOND_HALF'
}

function stageForSection(section: 'pre' | 'event' | 'closing'):
  | 'PRE_EDUCATION'
  | 'MAIN_EDUCATION'
  | 'POST_EDUCATION' {
  return section === 'pre'
    ? 'PRE_EDUCATION'
    : section === 'event'
      ? 'MAIN_EDUCATION'
      : 'POST_EDUCATION'
}

function typedStageRows(
  halfPlan: UjatTypedHalfPlan | undefined,
  section: 'pre' | 'event' | 'closing'
): UjatTypedScheduleRow[] {
  const stage = halfPlan?.stages?.find(item => item.stage === stageForSection(section))
  return stage?.rows ?? []
}

function typedStage(
  halfPlan: UjatTypedHalfPlan | undefined,
  section: 'pre' | 'event' | 'closing'
): UjatTypedEducationStagePlan | undefined {
  return halfPlan?.stages?.find(item => item.stage === stageForSection(section))
}

function typedDelivery(value: string | null | undefined, fallback: UjatEducationDelivery): UjatEducationDelivery {
  return value === 'online' || value === 'offline' || value === 'hybrid' ? value : fallback
}

function typedDateLabel(row: UjatTypedScheduleRow): string {
  const date = row.startDate ?? row.dates?.[0] ?? row.endDate ?? null
  return formatScheduleDateLabel(date)
}

function formatTypedScheduleLines(rows: UjatTypedScheduleRow[]): string {
  const lines = rows
    .slice()
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .map(row => {
      const region = row.regionCode ? regionLabelByKey(row.regionCode) : ''
      const date = typedDateLabel(row)
      if (!region && date === '-') return ''
      if (!region) return date
      return `${region} : ${date}`
    })
    .filter(Boolean)
  return lines.length > 0 ? lines.join('\n') : '-'
}

/** Canonical Typed RHF/server projection. This path does not read the registration overlay. */
export function resolveUjatHalfEducationScheduleDisplayFromTypedDetail(
  detail: UjatTypedDetail | null | undefined,
  half: UjatHalfSemesterKey
): UjatHalfEducationScheduleDisplay {
  const halfPlan = detail?.halfPlans?.find(item => item.semesterType === semesterForHalf(half))
  const preRows = typedStageRows(halfPlan, 'pre')
  const eventRows = typedStageRows(halfPlan, 'event')
  const closingRows = typedStageRows(halfPlan, 'closing')
  const eventRow = eventRows[0]
  const preStage = typedStage(halfPlan, 'pre')
  const eventStage = typedStage(halfPlan, 'event')
  const closingStage = typedStage(halfPlan, 'closing')
  const rangeStarts = eventRows.map(row => row.startDate).filter((value): value is string => Boolean(value))
  const rangeEnds = eventRows.map(row => row.endDate).filter((value): value is string => Boolean(value))
  const start = rangeStarts.sort()[0] ?? null
  const end = rangeEnds.sort().at(-1) ?? null
  const textbook = preRows[0]?.textbook
  const hasPre = preRows.length > 0 || preStage != null
  const hasEvent = eventRows.length > 0 || eventStage != null
  const hasClosing = closingRows.length > 0 || closingStage != null

  return {
    preEducation: {
      scheduleName: preRows[0]?.educationName?.trim() || '사전교육(발대식)',
      scheduleText: formatTypedScheduleLines(preRows),
      deliveryLabel: hasPre
        ? UJAT_EDUCATION_DELIVERY_LABEL[typedDelivery(preRows[0]?.educationMethod, 'online')]
        : '-',
      textbookEducationLabel: hasPre
        ? formatTextbookEducationLabel(
            textbook?.provisionMethod === 'instructor_outsource' ? 'instructor_outsource' : 'ja',
            textbook?.responsiblePerson ?? undefined
          )
        : '-',
    },
    eventSchedule: {
      scheduleName: eventRow?.educationName?.trim() || '교육 진행',
      scheduleText: formatUjatEventRangeLabel({ start, end }),
      deliveryLabel: hasEvent
        ? UJAT_EDUCATION_DELIVERY_LABEL[typedDelivery(eventRow?.educationMethod, 'offline')]
        : '-',
    },
    closingCeremony: {
      scheduleName: closingRows[0]?.educationName?.trim() || '해단식',
      scheduleText: formatTypedScheduleLines(closingRows),
      deliveryLabel: hasClosing
        ? UJAT_EDUCATION_DELIVERY_LABEL[typedDelivery(closingRows[0]?.educationMethod, 'online')]
        : '-',
    },
  }
}

function regionLabelByKey(regionKey: string): string {
  return getUjatEducationRegionLabel(regionKey, regionKey)
}

function formatScheduleDateLabel(iso: string | null | undefined): string {
  if (!iso) return '-'
  const d = dayjs(iso)
  if (!d.isValid()) return '-'
  return formatShortYearMdWithKoreanWeekday(d)
}

function readMultiBundle(
  overlay: Record<string, unknown>,
  key: string
): UjatHalfMultiScheduleBundle {
  const raw = overlay[key]
  if (!raw || typeof raw !== 'object') return EMPTY_UJAT_HALF_MULTI_SCHEDULE_BUNDLE
  const o = raw as UjatHalfMultiScheduleBundle
  return {
    rowIds: Array.isArray(o.rowIds) ? o.rowIds : EMPTY_UJAT_HALF_MULTI_SCHEDULE_BUNDLE.rowIds,
    regionByRow: o.regionByRow ?? {},
    dateByRow: o.dateByRow ?? {},
  }
}

function readEventRange(overlay: Record<string, unknown>, key: string): UjatHalfEventRangeSeal {
  const raw = overlay[key]
  if (!raw || typeof raw !== 'object') return EMPTY_UJAT_HALF_EVENT_RANGE_SEAL
  const o = raw as UjatHalfEventRangeSeal
  return { start: o.start ?? null, end: o.end ?? null }
}

function readString(overlay: Record<string, unknown>, key: string, fallback: string): string {
  const v = overlay[key]
  return typeof v === 'string' && v.trim() ? v.trim() : fallback
}

function readDelivery(
  overlay: Record<string, unknown>,
  key: string,
  fallback: UjatEducationDelivery
): UjatEducationDelivery {
  const v = overlay[key]
  if (v === 'online' || v === 'offline' || v === 'hybrid') return v
  return fallback
}

function readTextbookMode(
  overlay: Record<string, unknown>,
  key: string
): UjatTextbookEducationMode {
  const v = overlay[key]
  return v === 'instructor_outsource' ? 'instructor_outsource' : 'ja'
}

function formatMultiScheduleLines(bundle: UjatHalfMultiScheduleBundle): string {
  const lines = bundle.rowIds
    .map(id => {
      const regions = (bundle.regionByRow[String(id)] ?? [])
        .map(regionLabelByKey)
        .filter(Boolean)
      const dateLabel = formatScheduleDateLabel(bundle.dateByRow[String(id)] ?? null)
      if (regions.length === 0 && dateLabel === '-') return ''
      if (regions.length === 0) return dateLabel
      return `${regions.join(', ')} : ${dateLabel}`
    })
    .filter(Boolean)
  return lines.length > 0 ? lines.join('\n') : '-'
}

function formatTextbookEducationLabel(
  mode: UjatTextbookEducationMode,
  instructorId: string | undefined
): string {
  if (mode === 'ja') return 'JA 진행'
  return instructorId ? '강사 섭외' : '강사 섭외'
}

export function resolveUjatHalfEducationScheduleDisplay(
  half: UjatHalfSemesterKey,
  overlayInput?: Record<string, unknown>
): UjatHalfEducationScheduleDisplay {
  const overlay = overlayInput ?? resolveUjatRegistrationBasicInfoOverlay()
  const keys = ujatHalfScheduleOverlayKeys(half)

  const preMulti = readMultiBundle(overlay, keys.preMulti)
  const closingMulti = readMultiBundle(overlay, keys.closingMulti)
  const eventRange = readEventRange(overlay, keys.eventRange)

  const preDelivery = readDelivery(overlay, keys.preDelivery, 'online')
  const eventDelivery = readDelivery(overlay, keys.eventDelivery, 'offline')
  const closingDelivery = readDelivery(overlay, keys.closingDelivery, 'online')
  const hasPre = overlay[keys.preName] != null || overlay[keys.preMulti] != null || overlay[keys.preDelivery] != null
  const hasEvent = overlay[keys.eventName] != null || overlay[keys.eventRange] != null || overlay[keys.eventDelivery] != null
  const hasClosing =
    overlay[keys.closingName] != null || overlay[keys.closingMulti] != null || overlay[keys.closingDelivery] != null

  const textbookMode = readTextbookMode(overlay, keys.preTextbookMode)
  const textbookInstructorRaw = overlay[keys.preTextbookInstructorId]
  const textbookInstructorId =
    typeof textbookInstructorRaw === 'string' ? textbookInstructorRaw : undefined

  return {
    preEducation: {
      scheduleName: readString(overlay, keys.preName, '사전교육(발대식)'),
      scheduleText: formatMultiScheduleLines(preMulti),
      deliveryLabel: hasPre ? UJAT_EDUCATION_DELIVERY_LABEL[preDelivery] : '-',
      textbookEducationLabel: hasPre
        ? formatTextbookEducationLabel(textbookMode, textbookInstructorId)
        : '-',
    },
    eventSchedule: {
      scheduleName: readString(overlay, keys.eventName, '교육 진행'),
      scheduleText: formatUjatEventRangeLabel(eventRange),
      deliveryLabel: hasEvent ? UJAT_EDUCATION_DELIVERY_LABEL[eventDelivery] : '-',
    },
    closingCeremony: {
      scheduleName: readString(overlay, keys.closingName, '해단식'),
      scheduleText: formatMultiScheduleLines(closingMulti),
      deliveryLabel: hasClosing ? UJAT_EDUCATION_DELIVERY_LABEL[closingDelivery] : '-',
    },
  }
}

/** 등록 양식·상세 데모 — overlay 미설정 시 시드 */
export function buildUjatHalfEducationScheduleOverlayDefaults(
  half: UjatHalfSemesterKey
): Record<string, unknown> {
  const keys = ujatHalfScheduleOverlayKeys(half)

  if (half === 'h1') {
    return {
      [keys.preName]: '사전교육(발대식)',
      [keys.preMulti]: {
        rowIds: [0, 1],
        regionByRow: {
          '0': ['seoul', 'gyeonggi_south', 'daejeon', 'incheon'],
          '1': ['daegu', 'busan', 'jeonbuk_jeonju', 'gwangju'],
        },
        dateByRow: {
          '0': '2026-02-25T00:00:00.000Z',
          '1': '2026-02-27T00:00:00.000Z',
        },
      },
      [keys.preDelivery]: 'online',
      [keys.preTextbookMode]: 'ja',
      [keys.eventName]: '교육 진행',
      [keys.eventRange]: {
        start: '2026-04-03T00:00:00.000Z',
        end: '2026-06-19T00:00:00.000Z',
      },
      [keys.eventDelivery]: 'offline',
      [keys.closingName]: '해단식',
      [keys.closingMulti]: {
        rowIds: [0],
        regionByRow: { '0': [] },
        dateByRow: { '0': '2026-07-03T00:00:00.000Z' },
      },
      [keys.closingDelivery]: 'online',
    }
  }

  return {
    [keys.preName]: '사전교육(발대식)',
    [keys.preMulti]: {
      rowIds: [0, 1],
      regionByRow: {
        '0': ['seoul', 'gyeonggi_south', 'daejeon', 'incheon'],
        '1': ['daegu', 'busan', 'jeonbuk_jeonju', 'gwangju'],
      },
      dateByRow: {
        '0': '2026-08-19T00:00:00.000Z',
        '1': '2026-08-21T00:00:00.000Z',
      },
    },
    [keys.preDelivery]: 'online',
    [keys.preTextbookMode]: 'ja',
    [keys.eventName]: '교육 진행',
    [keys.eventRange]: {
      start: '2026-09-11T00:00:00.000Z',
      end: '2026-11-20T00:00:00.000Z',
    },
    [keys.eventDelivery]: 'offline',
    [keys.closingName]: '해단식',
    [keys.closingMulti]: {
      rowIds: [0],
      regionByRow: { '0': [] },
      dateByRow: { '0': '2026-12-04T00:00:00.000Z' },
    },
    [keys.closingDelivery]: 'online',
  }
}

export function buildUjatHalfEducationScheduleOverlayFromProgram(
  _program: import('@/types/domain').Program,
  half: UjatHalfSemesterKey
): Record<string, unknown> {
  return buildUjatHalfEducationScheduleOverlayDefaults(half)
}
