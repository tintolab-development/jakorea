import { describe, expect, it } from 'vitest'
import { buildRegionAssignmentExcelFilename } from './export-region-assignment-excel'

describe('buildRegionAssignmentExcelFilename', () => {
  it('UTC 전날이어도 KST 날짜로 파일명을 만든다', () => {
    // 2026-10-27 08:30 KST = 2026-10-26 23:30 UTC
    expect(buildRegionAssignmentExcelFilename('서울', new Date('2026-10-26T23:30:00Z'))).toBe(
      '[JA Korea] CMS 어드민_배정표_서울_261027.xlsx'
    )
  })

  it('KST 자정 직전은 같은 날짜를 유지한다', () => {
    expect(buildRegionAssignmentExcelFilename('부산', new Date('2026-10-27T14:59:00Z'))).toBe(
      '[JA Korea] CMS 어드민_배정표_부산_261027.xlsx'
    )
  })
})
