import type { UjatEducationHalfRange } from '../model/types.ts'

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const TOKEN_DATE_RE = /(\d{4}-\d{2}-\d{2})/
const HALF_TOKEN_RE = /^(h[12]):(.+)$/i
const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const

const SEOUL_YMD_FORMAT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export type UjatPreferredEducationDateOption = {
  id: string
  date: string
  label: string
}

export type UjatPreferredEducationScheduleOption = {
  id: string
  date: string
  display: string
}

export type { UjatEducationHalfRange }

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function seoulCalendarDate(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const dateOnly = ISO_DATE_RE.exec(trimmed)
  if (dateOnly) return dateOnly[0]
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return null
  return SEOUL_YMD_FORMAT.format(parsed)
}

function parseIsoDate(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  return seoulCalendarDate(raw)
}

function parseHalfAndDateFromId(id: string): { half: 'h1' | 'h2'; date: string } | null {
  const match = HALF_TOKEN_RE.exec(id.trim())
  if (!match) return null
  const date = seoulCalendarDate(match[2] ?? '')
  if (!date) return null
  const half = match[1].toLowerCase() === 'h2' ? 'h2' : 'h1'
  return { half, date }
}

function parseRuntimeOption(row: unknown): UjatPreferredEducationScheduleOption | null {
  const record = asRecord(row)
  if (!record) return null
  const idRaw = typeof record.id === 'string' ? record.id.trim() : ''
  const fromId = idRaw ? parseHalfAndDateFromId(idRaw) : null
  if (!fromId) return null
  const id = `${fromId.half}:${fromId.date}`
  const date = parseIsoDate(record.date) ?? fromId.date
  const label =
    typeof record.label === 'string' && record.label.trim()
      ? record.label.trim()
      : displayFromIsoDate(date)
  return { id, date, display: label }
}

function collectUjatPreferredEducationDateOptionRows(runtime: unknown): unknown[] {
  const record = asRecord(runtime)
  if (!record) return []
  const rows: unknown[] = []
  const push = (value: unknown) => {
    if (!Array.isArray(value)) return
    rows.push(...value)
  }
  push(record.ujatPreferredEducationDateOptions)
  const audience = asRecord(record.audienceApplication)
  if (audience) push(audience.ujatPreferredEducationDateOptions)
  return rows
}

/** runtimeContext(또는 audience)에 후보 배열 키가 있으면 true. 빈 `[]`도 true. */
export function hasUjatPreferredEducationDateOptionsKey(runtime: unknown): boolean {
  const record = asRecord(runtime)
  if (!record) return false
  if (Array.isArray(record.ujatPreferredEducationDateOptions)) return true
  const audience = asRecord(record.audienceApplication)
  return Array.isArray(audience?.ujatPreferredEducationDateOptions)
}

/**
 * 후보 배열을 그대로 파싱한다. `{ id, date, label }` 행 또는 runtimeContext 형태.
 * 반기 금요일 전개·선택분만으로 보완하지 않는다.
 */
export function parseUjatPreferredEducationDateOptionRows(
  rows: readonly unknown[] | null | undefined,
): UjatPreferredEducationScheduleOption[] {
  if (!Array.isArray(rows)) return []
  return dedupeOptionsPreserveOrder(
    rows.flatMap(row => {
      const option = parseRuntimeOption(row)
      return option ? [option] : []
    }),
  )
}

function sortOptions(
  options: UjatPreferredEducationScheduleOption[],
): UjatPreferredEducationScheduleOption[] {
  return options.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
}

function dedupeOptionsPreserveOrder(
  options: UjatPreferredEducationScheduleOption[],
): UjatPreferredEducationScheduleOption[] {
  const byId = new Map<string, UjatPreferredEducationScheduleOption>()
  for (const option of options) {
    if (!byId.has(option.id)) byId.set(option.id, option)
  }
  return [...byId.values()]
}

function dedupeOptions(
  options: UjatPreferredEducationScheduleOption[],
): UjatPreferredEducationScheduleOption[] {
  return sortOptions(dedupeOptionsPreserveOrder(options))
}

/**
 * form.runtimeContext.ujatPreferredEducationDateOptions (및 audienceApplication 동일 키).
 * BE 배열 순서를 유지한다. educationScheduleLines·schedules 로 금요일을 만들지 않는다.
 * id 가 h1:/h2:YYYY-MM-DD 가 아니면 버린다. date/label 로 id 를 만들지 않는다.
 */
export function readUjatPreferredEducationScheduleOptions(input: {
  runtimeContext?: unknown
}): UjatPreferredEducationScheduleOption[] {
  return dedupeOptionsPreserveOrder(
    collectUjatPreferredEducationDateOptionRows(input.runtimeContext).flatMap(row => {
      const option = parseRuntimeOption(row)
      return option ? [option] : []
    }),
  )
}

function optionMatchesToken(
  option: UjatPreferredEducationScheduleOption,
  token: string,
): boolean {
  return option.id === token.trim()
}

/** 신청 답변 토큰은 option.id(h1:|h2:YYYY-MM-DD)만 매칭한다. date 로 id 를 재구성하지 않는다. */
export function resolveUjatPreferredScheduleSelectedOptions(
  selectedTokens: readonly string[],
  options: readonly UjatPreferredEducationScheduleOption[],
): UjatPreferredEducationScheduleOption[] {
  const tokens = new Set(selectedTokens.map(token => token.trim()).filter(Boolean))
  return options.filter(option => tokens.has(option.id))
}

export function isUjatPreferredScheduleOptionSelected(
  option: UjatPreferredEducationScheduleOption,
  selectedTokens: readonly string[],
): boolean {
  return selectedTokens.some(token => optionMatchesToken(option, token))
}

export function isUjatPreferredScheduleSelectedId(token: string): boolean {
  return parseHalfAndDateFromId(token) != null
}

function dateFromToken(raw: string): string | null {
  const match = TOKEN_DATE_RE.exec(raw.trim())
  return match ? match[1] : null
}

function displayFromIsoDate(date: string): string {
  const match = ISO_DATE_RE.exec(date)
  if (!match) return date
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const weekday = WEEKDAY_KO[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
  return `${year}년 ${month}월 ${day}일(${weekday})`
}

function addUtcDays(date: string, days: number): string | null {
  const match = ISO_DATE_RE.exec(date)
  if (!match) return null
  const next = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days))
  const year = next.getUTCFullYear()
  const month = String(next.getUTCMonth() + 1).padStart(2, '0')
  const day = String(next.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isFriday(date: string): boolean {
  const match = ISO_DATE_RE.exec(date)
  if (!match) return false
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))).getUTCDay() === 5
}

export function mapUjatEducationHalfRangesFromSchedules(
  schedules:
    | ReadonlyArray<{
        scheduleKind?: string | null
        term?: string | null
        startAt?: string | null
        endAt?: string | null
      }>
    | undefined,
): UjatEducationHalfRange[] {
  const out: UjatEducationHalfRange[] = []
  for (const schedule of schedules ?? []) {
    if (String(schedule.scheduleKind ?? '').trim().toUpperCase() !== 'EDUCATION') continue
    const term = String(schedule.term ?? '').trim().toUpperCase()
    const half = term === 'FIRST_HALF' ? 'h1' : term === 'SECOND_HALF' ? 'h2' : null
    const startAt = typeof schedule.startAt === 'string' ? schedule.startAt.trim() : ''
    const endAt = typeof schedule.endAt === 'string' ? schedule.endAt.trim() : ''
    if (!half || !startAt || !endAt) continue
    out.push({ half, startAt, endAt })
  }
  return out
}

/**
 * CMS `buildProgramLinkedScheduleOptions` 와 같이 반기 구간의 금요일만 펼친다.
 * 진행 불가일은 portal schedules에 없으므로 여기서 빼지 않는다.
 */
export function expandUjatPreferredEducationScheduleOptionsFromHalfRanges(
  ranges: readonly UjatEducationHalfRange[] | null | undefined,
): UjatPreferredEducationScheduleOption[] {
  const options: UjatPreferredEducationScheduleOption[] = []
  for (const range of ranges ?? []) {
    const start = seoulCalendarDate(range.startAt)
    const end = seoulCalendarDate(range.endAt)
    if (!start || !end) continue
    const first = start <= end ? start : end
    const last = start <= end ? end : start
    for (let cursor: string | null = first; cursor && cursor <= last; cursor = addUtcDays(cursor, 1)) {
      if (!isFriday(cursor)) continue
      options.push({
        id: `${range.half}:${cursor}`,
        date: cursor,
        display: displayFromIsoDate(cursor),
      })
    }
  }
  return dedupeOptions(options)
}

/**
 * 신청 칩 SSOT: form-bindings runtimeContext.ujatPreferredEducationDateOptions 만 사용한다.
 * EDUCATION 반기 구간·educationScheduleLines 로 금요일을 만들지 않는다.
 */
export function resolveUjatApplyPreferredEducationScheduleOptions(input: {
  runtimeContext?: unknown
  halfRanges?: readonly UjatEducationHalfRange[] | null
}): UjatPreferredEducationScheduleOption[] {
  void input.halfRanges
  return readUjatPreferredEducationScheduleOptions({
    runtimeContext: input.runtimeContext,
  })
}

/**
 * 임시배정 1단계 칩 SSOT.
 * 1) me/render runtimeContext.ujatPreferredEducationDateOptions (키 있으면 빈 배열도 채택)
 * 2) supplement.ujat.preferredEducationDateOptions
 * 반기 금요일·선택분 answers 로 보완하지 않는다.
 */
export function resolveUjatProgressConfirmPreferredEducationScheduleOptions(input: {
  runtimeContext?: unknown
  supplementPreferredEducationDateOptions?: readonly unknown[] | null
}): UjatPreferredEducationScheduleOption[] {
  if (hasUjatPreferredEducationDateOptionsKey(input.runtimeContext)) {
    return readUjatPreferredEducationScheduleOptions({
      runtimeContext: input.runtimeContext,
    })
  }
  if (Array.isArray(input.supplementPreferredEducationDateOptions)) {
    return parseUjatPreferredEducationDateOptionRows(input.supplementPreferredEducationDateOptions)
  }
  return []
}

/**
 * 제출된 신청 answers의 희망일만으로 칩을 만든다.
 * 신청용 form-bindings 가 APPLICATION_ALREADY_SUBMITTED 일 때 후보 배열이 없을 때의 fallback.
 * 선택되지 않은 금요일을 생성하지 않는다.
 */
export function readUjatPreferredEducationScheduleOptionsFromSubmittedAnswer(
  answer: unknown,
): UjatPreferredEducationScheduleOption[] {
  const fromRuntime = readUjatPreferredEducationScheduleOptions({
    runtimeContext: asRecord(answer),
  })
  if (fromRuntime.length > 0) return fromRuntime

  const nested = asRecord(answer)
  const tokens: string[] = []
  const pushTokens = (value: unknown) => {
    if (!Array.isArray(value)) return
    for (const item of value) {
      if (typeof item === 'string' && item.trim()) tokens.push(item.trim())
    }
  }
  if (nested) {
    pushTokens(asRecord(nested.ujatApplication)?.preferredScheduleSelectedIds)
    pushTokens(nested.selectedIds)
    pushTokens(nested.dates)
  } else if (Array.isArray(answer)) {
    pushTokens(answer)
  }

  const byDate = new Map<string, UjatPreferredEducationScheduleOption>()
  for (const token of tokens) {
    const date = dateFromToken(token)
    if (!date || byDate.has(date)) continue
    const id = token.includes(':') ? token : date
    byDate.set(date, {
      id,
      date,
      display: displayFromIsoDate(date),
    })
  }
  return sortOptions([...byDate.values()])
}
