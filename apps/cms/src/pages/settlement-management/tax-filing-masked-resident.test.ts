import { describe, expect, it } from 'vitest'
import { formatTaxFilingPreviewResidentId } from './tax-filing-masked-resident'

describe('formatTaxFilingPreviewResidentId', () => {
  it('뒷자리 6자리를 마스킹한다', () => {
    expect(formatTaxFilingPreviewResidentId('900101-1234567')).toBe('900101-1******')
    expect(formatTaxFilingPreviewResidentId('9001011234567')).toBe('900101-1******')
  })

  it('이미 마스킹된 값은 복원하지 않는다', () => {
    expect(formatTaxFilingPreviewResidentId('900101-1******')).toBe('900101-1******')
    expect(formatTaxFilingPreviewResidentId('900101-*******')).toBe('900101-*******')
  })

  it('없으면 대시', () => {
    expect(formatTaxFilingPreviewResidentId(null)).toBe('-')
    expect(formatTaxFilingPreviewResidentId('')).toBe('-')
  })
})
