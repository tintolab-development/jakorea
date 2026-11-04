import { describe, expect, it } from 'vitest'
import {
  buildSettlementFormExcelFilename,
  formatAsiaSeoulYymmdd,
  SETTLEMENT_FORM_DOWNLOAD_REASON,
} from './settlement-form-download'

describe('settlement-form-download', () => {
  it('다운로드 reason은 화이트리스트 문구와 완전 일치한다', () => {
    expect(SETTLEMENT_FORM_DOWNLOAD_REASON['bulk-transfer']).toBe('대량이체 양식 발급')
    expect(SETTLEMENT_FORM_DOWNLOAD_REASON['tax-report']).toBe('세금신고 양식 발급')
  })

  it('YYMMDD는 UTC slice가 아니라 Asia/Seoul 달력일이다', () => {
    const utcStillNinth = new Date('2026-10-09T16:00:00.000Z')
    expect(utcStillNinth.toISOString().slice(0, 10)).toBe('2026-10-09')
    expect(formatAsiaSeoulYymmdd(utcStillNinth)).toBe('261010')
    expect(buildSettlementFormExcelFilename('bulk-transfer', utcStillNinth)).toBe(
      '[JA Korea] CMS 어드민_대량이체 양식_261010.xlsx'
    )
    expect(buildSettlementFormExcelFilename('tax-report', utcStillNinth)).toBe(
      '[JA Korea] CMS 어드민_세금신고 양식_261010.xlsx'
    )
  })
})
