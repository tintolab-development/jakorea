/**
 * TT 등록 신청정보 — RHF typed values ↔ overlay-key adapter / Form Version serializer.
 * Overlay store를 정본으로 읽지 않는다. Dayjs는 UI 경계에서만 변환한다.
 */
import type {
  TrainedTeachersApplicationBasicInfoState,
  TrainedTeachersApplicationFormState,
  TrainedTeachersPreferredScheduleBlock,
} from './registration-canonical-types'

const PREFIX = 'application.trainedTeachers'
const BASIC_PREFIX = `${PREFIX}.basicInfo.`

const BASIC_KEYS: Array<keyof TrainedTeachersApplicationBasicInfoState> = [
  'applicationGrade',
  'classCount',
  'educationFormat',
  'educationPlace',
  'detailAddress',
  'totalStudents',
  'educationPlaceDetail',
  'teacherTel',
  'teacherMobile',
  'teacherEmail',
  'applicationReason',
  'otherRequests',
]

export function emptyTrainedTeachersApplicationFormState(): TrainedTeachersApplicationFormState {
  return {
    basicInfo: {
      applicationGrade: '',
      classCount: '',
      educationFormat: '',
      educationPlace: '',
      detailAddress: '',
      totalStudents: '',
      educationPlaceDetail: '',
      teacherTel: '',
      teacherMobile: '',
      teacherEmail: '',
      applicationReason: '',
      otherRequests: '',
    },
    preferredSchedules: [],
  }
}

export function isTrainedTeachersApplicationOverlayKey(key: string): boolean {
  return key.startsWith(`${PREFIX}.`)
}

export function isTrainedTeachersApplicationCatalog(templateCode: string | null | undefined): boolean {
  return templateCode == null || templateCode === '' || templateCode === 'application-trained-teachers'
}

export function cloneTrainedTeachersApplicationState(
  state: TrainedTeachersApplicationFormState
): TrainedTeachersApplicationFormState {
  return structuredClone(state)
}

export function collectTrainedTeachersApplicationState(
  state: TrainedTeachersApplicationFormState
): TrainedTeachersApplicationFormState {
  return cloneTrainedTeachersApplicationState(state)
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}

function formatDateValue(value: unknown): string | null {
  if (value == null || value === '') return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
    const parsed = new Date(trimmed)
    if (Number.isNaN(parsed.getTime())) return trimmed
    const y = parsed.getFullYear()
    const m = String(parsed.getMonth() + 1).padStart(2, '0')
    const d = String(parsed.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  if (typeof value === 'object' && value !== null && 'format' in value) {
    const formatted = (value as { format: (token: string) => string }).format('YYYY-MM-DD')
    return formatted || null
  }
  return null
}

function formatTimeValue(value: unknown): string | null {
  if (value == null || value === '') return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    const hhmm = trimmed.match(/^(\d{2}:\d{2})/)
    if (hhmm) return hhmm[1]
    return trimmed
  }
  if (typeof value === 'object' && value !== null && 'format' in value) {
    const formatted = (value as { format: (token: string) => string }).format('HH:mm')
    return formatted || null
  }
  return null
}

function isEmptyTimeRow(row: { classPeriod: string; start: string | null; end: string | null }): boolean {
  return row.classPeriod.trim() === '' && row.start == null && row.end == null
}

function isEmptyScheduleBlock(block: TrainedTeachersPreferredScheduleBlock): boolean {
  return (
    block.date == null &&
    (block.session == null || block.session === '') &&
    block.times.every(isEmptyTimeRow)
  )
}

export function normalizeTrainedTeachersPreferredSchedules(
  raw: unknown
): TrainedTeachersPreferredScheduleBlock[] {
  if (!Array.isArray(raw)) return []
  return raw.map(item => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return { date: null, times: [] }
    }
    const rec = item as Record<string, unknown>
    const times = Array.isArray(rec.times)
      ? rec.times.map(time => {
          const row = time && typeof time === 'object' ? (time as Record<string, unknown>) : {}
          return {
            classPeriod: asString(row.classPeriod),
            start: formatTimeValue(row.start ?? row.startTime),
            end: formatTimeValue(row.end ?? row.endTime),
          }
        })
      : []
    return {
      date: formatDateValue(rec.date),
      session: typeof rec.session === 'string' ? rec.session : undefined,
      times,
    }
  })
}

export function persistableTrainedTeachersPreferredSchedules(
  raw: unknown
): TrainedTeachersPreferredScheduleBlock[] {
  return normalizeTrainedTeachersPreferredSchedules(raw).filter(block => !isEmptyScheduleBlock(block))
}

export function readTrainedTeachersApplicationOverlayValue(
  state: TrainedTeachersApplicationFormState,
  key: string
): unknown {
  if (key === `${PREFIX}.preferredSchedules`) {
    return state.preferredSchedules
  }
  if (key.startsWith(BASIC_PREFIX)) {
    const field = key.slice(BASIC_PREFIX.length) as keyof TrainedTeachersApplicationBasicInfoState
    if (BASIC_KEYS.includes(field)) return state.basicInfo[field]
  }
  return undefined
}

export function writeTrainedTeachersApplicationOverlayValue(
  state: TrainedTeachersApplicationFormState,
  key: string,
  value: unknown
): TrainedTeachersApplicationFormState {
  const next = cloneTrainedTeachersApplicationState(state)
  if (key === `${PREFIX}.preferredSchedules`) {
    next.preferredSchedules = normalizeTrainedTeachersPreferredSchedules(value)
    return next
  }
  if (key.startsWith(BASIC_PREFIX)) {
    const field = key.slice(BASIC_PREFIX.length) as keyof TrainedTeachersApplicationBasicInfoState
    if (BASIC_KEYS.includes(field)) next.basicInfo[field] = asString(value)
  }
  return next
}

export function applyTrainedTeachersApplicationOverlayRecord(
  state: TrainedTeachersApplicationFormState,
  overlay: Record<string, unknown>
): TrainedTeachersApplicationFormState {
  let next = state
  for (const [key, value] of Object.entries(overlay)) {
    if (!isTrainedTeachersApplicationOverlayKey(key)) continue
    next = writeTrainedTeachersApplicationOverlayValue(next, key, value)
  }
  return next
}

export function importLegacyTrainedTeachersApplicationOverlay(
  overlay: Record<string, unknown>
): TrainedTeachersApplicationFormState {
  return applyTrainedTeachersApplicationOverlayRecord(
    emptyTrainedTeachersApplicationFormState(),
    overlay
  )
}

/** Form Version extensionJson.overlay 출력. store/peek를 읽지 않는다. */
export function serializeTrainedTeachersApplicationForFormVersion(
  state: TrainedTeachersApplicationFormState
): Record<string, unknown> {
  const overlay: Record<string, unknown> = {
    [`${PREFIX}.preferredSchedules`]: persistableTrainedTeachersPreferredSchedules(
      state.preferredSchedules
    ),
  }
  for (const key of BASIC_KEYS) {
    overlay[`${BASIC_PREFIX}${key}`] = state.basicInfo[key]
  }
  return overlay
}

export function splitTrainedTeachersApplicationOverlay(
  record: Record<string, unknown>
): { application: Record<string, unknown>; rest: Record<string, unknown> } {
  const application: Record<string, unknown> = {}
  const rest: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    if (isTrainedTeachersApplicationOverlayKey(key)) application[key] = value
    else rest[key] = value
  }
  return { application, rest }
}
