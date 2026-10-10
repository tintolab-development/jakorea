import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { buildBulkTransferExcelFilename } from './bulk-transfer-excel'

describe('buildBulkTransferExcelFilename', () => {
  it('uses CMS admin bulk transfer prefix and YYMMDD', () => {
    expect(buildBulkTransferExcelFilename(dayjs('2026-10-10'))).toBe(
      '[JA Korea] CMS 어드민_대량이체 양식_261010.xlsx'
    )
  })
})
