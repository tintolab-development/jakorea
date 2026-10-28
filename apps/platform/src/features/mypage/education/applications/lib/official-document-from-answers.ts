import { GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTRUCTOR_IDS } from '@jakorea/form-schema/paragraph-ids/gemini-visiting-training-application-form-instructor-draft'

export type GeminiOfficialDocumentDisplay = {
  requiredLabel: string
  info: string
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function readTrimmed(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'boolean') return value ? '필요' : '필요 없음'
  return ''
}

function formatRequiredLabel(raw: string): string {
  const trimmed = raw.trim()
  const normalized = trimmed.toLowerCase()
  const compact = normalized.replace(/[\s_-]/g, '')
  if (
    compact === 'needed' ||
    compact === 'required' ||
    compact === 'true' ||
    compact === 'yes' ||
    compact === 'y' ||
    compact === 'receive' ||
    compact === 'received' ||
    trimmed === '필요' ||
    trimmed === '수신'
  ) {
    return '필요'
  }
  if (
    compact === 'notneeded' ||
    compact === 'unneeded' ||
    compact === 'unnecessary' ||
    compact === 'false' ||
    compact === 'no' ||
    compact === 'n' ||
    compact === 'none' ||
    trimmed === '필요 없음' ||
    trimmed === '필요없음' ||
    trimmed === '불필요' ||
    trimmed === '미수신'
  ) {
    return '불필요'
  }
  return trimmed
}

function readDataRows(raw: unknown): string[][] {
  if (!Array.isArray(raw)) return []
  return raw
    .map(row => (Array.isArray(row) ? row.map(cell => readTrimmed(cell)) : []))
    .filter(row => row.some(cell => cell.length > 0))
}

export function resolveGeminiOfficialDocumentFromAnswers(
  answers?: Record<string, unknown> | null,
): GeminiOfficialDocumentDisplay | null {
  if (!answers) return null
  const raw = answers[GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTRUCTOR_IDS.officialDocument]
  const row = asRecord(raw)
  const dataRows = readDataRows(row?.dataRows ?? raw)

  let requiredLabel = ''
  let info = ''

  for (const cells of dataRows) {
    const label = cells[0] ?? ''
    const value = cells[1] ?? ''
    if (label.includes('필요 여부')) {
      requiredLabel = formatRequiredLabel(value || label)
    } else if (label.includes('필요 정보')) {
      info = value
    } else if (!requiredLabel && value) {
      requiredLabel = formatRequiredLabel(label)
      info = value
    }
  }

  if (row) {
    if (!requiredLabel) {
      requiredLabel = formatRequiredLabel(
        readTrimmed(row.officialNeed) ||
          readTrimmed(row.required) ||
          readTrimmed(row.need) ||
          readTrimmed(row.officialDocumentRequired),
      )
    }
    if (!info) {
      info =
        readTrimmed(row.officialDetail) ||
        readTrimmed(row.info) ||
        readTrimmed(row.officialDocumentRequiredInfo) ||
        readTrimmed(row.detail)
    }
  }

  if (!requiredLabel && !info) return null
  return {
    requiredLabel: requiredLabel || '-',
    info: info || '-',
  }
}
