import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import { buildPersonalInfoAccessHistoryExcelFilename } from './personal-info-access-excel'

describe('personal-info-access-excel', () => {
  it('builds the spec filename with YYMMDD', () => {
    expect(buildPersonalInfoAccessHistoryExcelFilename(dayjs('2026-10-23'))).toBe(
      '[JA Korea] CMS 어드민_개인정보 조회 이력_261023'
    )
  })
})
