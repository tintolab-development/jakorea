const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const TOKEN_DATE_RE = /(\d{4}-\d{2}-\d{2})/
const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const

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

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function parseIsoDate(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const match = ISO_DATE_RE.exec(raw.trim())
  return match ? match[0] : null
}

function parseRuntimeOption(row: unknown): UjatPreferredEducationScheduleOption | null {
  const record = asRecord(row)
  if (!record) return null
  const date = parseIsoDate(record.date)
  const id = typeof record.id === 'string' ? record.id.trim() : ''
  if (!date || !id) return null
  const label =
    typeof record.label === 'string' && record.label.trim() ? record.label.trim() : date
  return { id, date, display: label }
}

/**
 * 기관 신청 희망일 칩 — form.runtimeContext.ujatPreferredEducationDateOptions 만 쓴다.
 * 공개 프로그램 educationScheduleLines 로 금요일을 만들지 않는다.
 * 배열이 없거나 [] 이면 빈 목록 (칩 대신 「선택 가능한 교육 일정이 없습니다.」).
 */
export function readUjatPreferredEducationScheduleOptions(input: {
  runtimeContext?: unknown
}): UjatPreferredEducationScheduleOption[] {
  const runtime = asRecord(input.runtimeContext)
  const raw = runtime?.ujatPreferredEducationDateOptions
  if (!Array.isArray(raw)) return []
  return raw
    .flatMap(row => {
      const option = parseRuntimeOption(row)
      return option ? [option] : []
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
}

function optionMatchesToken(
  option: UjatPreferredEducationScheduleOption,
  token: string,
): boolean {
  return option.id === token || option.date === token
}

/** 신청 답변 토큰(option.id 또는 YYYY-MM-DD)을 런타임 후보와만 매칭한다. 없는 날짜는 만들지 않는다. */
export function resolveUjatPreferredScheduleSelectedOptions(
  selectedTokens: readonly string[],
  options: readonly UjatPreferredEducationScheduleOption[],
): UjatPreferredEducationScheduleOption[] {
  const tokens = selectedTokens.map(token => token.trim()).filter(Boolean)
  return options.filter(option => tokens.some(token => optionMatchesToken(option, token)))
}

export function isUjatPreferredScheduleOptionSelected(
  option: UjatPreferredEducationScheduleOption,
  selectedTokens: readonly string[],
): boolean {
  return selectedTokens.some(token => optionMatchesToken(option, token.trim()))
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
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
}
