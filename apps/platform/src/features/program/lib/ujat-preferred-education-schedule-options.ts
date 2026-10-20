const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

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
