import { describe, expect, it } from 'vitest'
import {
  formatOfficialDocumentRequiredInfo,
  formatOfficialDocumentRequiredLabel,
} from './official-document'

describe('formatOfficialDocumentRequiredLabel', () => {
  it('maps boolean to Korean labels only', () => {
    expect(formatOfficialDocumentRequiredLabel(true)).toBe('필요')
    expect(formatOfficialDocumentRequiredLabel(false)).toBe('필요 없음')
    expect(formatOfficialDocumentRequiredLabel(null)).toBe('-')
    expect(formatOfficialDocumentRequiredLabel(undefined)).toBe('-')
  })
})

describe('formatOfficialDocumentRequiredInfo', () => {
  it('renders GET form text as-is and uses "-" only in UI when null', () => {
    expect(formatOfficialDocumentRequiredInfo('학교장 직인 필요')).toBe('학교장 직인 필요')
    expect(formatOfficialDocumentRequiredInfo(null)).toBe('-')
    expect(formatOfficialDocumentRequiredInfo('')).toBe('-')
    expect(formatOfficialDocumentRequiredInfo(undefined)).toBe('-')
  })

  it('does not invent the previous hardcoded copy', () => {
    expect(formatOfficialDocumentRequiredInfo(null)).not.toBe(
      '이름, 소속(학교), 연수예정일시, 연수인원'
    )
  })
})
