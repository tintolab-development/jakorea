export type ApplyGeminiInstructorOfficialNeed = 'needed' | 'not_needed'

export type ApplyGeminiInstructorOfficialDocumentValues = {
  officialNeed: ApplyGeminiInstructorOfficialNeed | ''
  officialDetail: string
}

const NEED_LABEL: Record<ApplyGeminiInstructorOfficialNeed, string> = {
  needed: '필요',
  not_needed: '필요 없음',
}

export function emptyGeminiInstructorOfficialDocument(): ApplyGeminiInstructorOfficialDocumentValues {
  return { officialNeed: '', officialDetail: '' }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function readTrimmed(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function parseOfficialNeed(raw: string): ApplyGeminiInstructorOfficialNeed | '' {
  const compact = raw.toLowerCase().replace(/[\s_-]/g, '')
  if (
    compact === 'needed' ||
    compact === 'required' ||
    compact === 'true' ||
    compact === 'yes' ||
    raw === '필요'
  ) {
    return 'needed'
  }
  if (
    compact === 'notneeded' ||
    compact === 'unneeded' ||
    compact === 'unnecessary' ||
    compact === 'false' ||
    compact === 'no' ||
    raw === '필요 없음' ||
    raw === '필요없음' ||
    raw === '불필요'
  ) {
    return 'not_needed'
  }
  return ''
}

function readDataRows(raw: unknown): string[][] {
  if (!Array.isArray(raw)) return []
  return raw
    .map(row => (Array.isArray(row) ? row.map(cell => readTrimmed(cell)) : []))
    .filter(row => row.some(cell => cell.length > 0))
}

export function geminiInstructorOfficialDocumentAnswerFromValues(
  values: ApplyGeminiInstructorOfficialDocumentValues,
): Record<string, unknown> | null {
  if (values.officialNeed !== 'needed' && values.officialNeed !== 'not_needed') return null
  const officialDetail = values.officialDetail.trim()
  return {
    officialNeed: values.officialNeed,
    officialDetail,
    dataRows: [
      ['공문 필요 여부', NEED_LABEL[values.officialNeed]],
      ['공문 필요 정보', officialDetail],
    ],
  }
}

export function geminiInstructorOfficialDocumentValuesFromDraftAnswer(
  answer: unknown,
): ApplyGeminiInstructorOfficialDocumentValues | null {
  const row = asRecord(answer)
  const dataRows = readDataRows(row?.dataRows ?? answer)
  let officialNeed: ApplyGeminiInstructorOfficialNeed | '' = ''
  let officialDetail = ''

  for (const cells of dataRows) {
    const label = cells[0] ?? ''
    const value = cells[1] ?? ''
    if (label.includes('필요 여부')) {
      officialNeed = parseOfficialNeed(value)
    } else if (label.includes('필요 정보')) {
      officialDetail = value
    }
  }

  if (row) {
    if (!officialNeed) {
      officialNeed = parseOfficialNeed(
        readTrimmed(row.officialNeed) ||
          readTrimmed(row.officialDocumentRequired) ||
          readTrimmed(row.need),
      )
    }
    if (!officialDetail) {
      officialDetail =
        readTrimmed(row.officialDetail) ||
        readTrimmed(row.officialDocumentRequiredInfo) ||
        readTrimmed(row.detail)
    }
  }

  if (!officialNeed && !officialDetail) return null
  return { officialNeed, officialDetail }
}

export function findIncompleteGeminiInstructorOfficialDocumentMessage(
  values: ApplyGeminiInstructorOfficialDocumentValues,
): string | null {
  if (values.officialNeed !== 'needed' && values.officialNeed !== 'not_needed') {
    return '공문 필요 여부를 선택해 주세요.'
  }
  if (values.officialNeed === 'needed' && !values.officialDetail.trim()) {
    return '공문에 필요한 정보를 작성해 주세요.'
  }
  return null
}
