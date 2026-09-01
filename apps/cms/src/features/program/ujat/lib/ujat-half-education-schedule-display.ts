import dayjs from 'dayjs'
import { mockInstructorsMap } from '@/data/mock/instructors'
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
import { resolveUjatRegistrationBasicInfoOverlay } from '@/features/program/ujat/lib/ujat-registration-basic-info-display'

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

function regionLabelByKey(regionKey: string): string {
  return getUjatEducationRegionLabel(regionKey, regionKey)
}

function formatScheduleDateLabel(iso: string | null | undefined): string {
  if (!iso) return '-'
  const d = dayjs(iso)
  if (!d.isValid()) return '-'
  const yy = String(d.year()).slice(-2)
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  return `${yy}년 ${d.month() + 1}월 ${d.date()}일(${weekdays[d.day()]})`
}

function formatEventRangeLabel(seal: UjatHalfEventRangeSeal): string {
  if (!seal.start && !seal.end) return '-'
  const start = seal.start ? dayjs(seal.start) : null
  const end = seal.end ? dayjs(seal.end) : null
  if (start?.isValid() && end?.isValid()) {
    return `${start.format('YYYY년 M월 D일(ddd)')} ~ ${formatScheduleDateLabel(seal.end)}`
  }
  if (start?.isValid()) return start.format('YYYY년 M월 D일(ddd)')
  return formatScheduleDateLabel(seal.end)
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
  const name = instructorId ? mockInstructorsMap.get(instructorId)?.name : undefined
  return name ? `강사 섭외 (${name})` : '강사 섭외'
}

export function resolveUjatHalfEducationScheduleDisplay(
  half: UjatHalfSemesterKey,
  overlayInput?: Record<string, unknown>
): UjatHalfEducationScheduleDisplay {
  const overlay = {
    ...buildUjatHalfEducationScheduleOverlayDefaults(half),
    ...(overlayInput ?? resolveUjatRegistrationBasicInfoOverlay()),
  }
  const keys = ujatHalfScheduleOverlayKeys(half)

  const preMulti = readMultiBundle(overlay, keys.preMulti)
  const closingMulti = readMultiBundle(overlay, keys.closingMulti)
  const eventRange = readEventRange(overlay, keys.eventRange)

  const preDelivery = readDelivery(overlay, keys.preDelivery, 'online')
  const eventDelivery = readDelivery(overlay, keys.eventDelivery, 'offline')
  const closingDelivery = readDelivery(overlay, keys.closingDelivery, 'online')

  const textbookMode = readTextbookMode(overlay, keys.preTextbookMode)
  const textbookInstructorRaw = overlay[keys.preTextbookInstructorId]
  const textbookInstructorId =
    typeof textbookInstructorRaw === 'string' ? textbookInstructorRaw : undefined

  return {
    preEducation: {
      scheduleName: readString(overlay, keys.preName, '사전교육(발대식)'),
      scheduleText: formatMultiScheduleLines(preMulti),
      deliveryLabel: UJAT_EDUCATION_DELIVERY_LABEL[preDelivery],
      textbookEducationLabel: formatTextbookEducationLabel(textbookMode, textbookInstructorId),
    },
    eventSchedule: {
      scheduleName: readString(overlay, keys.eventName, '교육 진행'),
      scheduleText: formatEventRangeLabel(eventRange),
      deliveryLabel: UJAT_EDUCATION_DELIVERY_LABEL[eventDelivery],
    },
    closingCeremony: {
      scheduleName: readString(overlay, keys.closingName, '해단식'),
      scheduleText: formatMultiScheduleLines(closingMulti),
      deliveryLabel: UJAT_EDUCATION_DELIVERY_LABEL[closingDelivery],
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
