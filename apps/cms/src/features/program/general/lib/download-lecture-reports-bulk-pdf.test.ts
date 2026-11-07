import { describe, expect, it } from 'vitest'
import {
  filterLectureReportBulkPdfRows,
  normalizeLectureReportPdfFileName,
  uniqueLectureReportPdfFileName,
} from './download-lecture-reports-bulk-pdf'

describe('download-lecture-reports-bulk-pdf', () => {
  it('제출 완료이고 reportId가 있는 행만 PDF 대상으로 둔다', () => {
    expect(
      filterLectureReportBulkPdfRows([
        { canViewReport: true, reportId: 11 },
        { canViewReport: true, reportId: 0 },
        { canViewReport: false, reportId: 12 },
        { canViewReport: true },
        { canViewReport: true, reportId: 13 },
      ]).map(row => row.reportId)
    ).toEqual([11, 13])
  })

  it('ZIP 엔트리 이름이 겹치면 접미사를 붙인다', () => {
    const used = new Set<string>()
    expect(uniqueLectureReportPdfFileName('강의보고서_학교_강사_260108', used)).toBe(
      '강의보고서_학교_강사_260108.pdf'
    )
    expect(uniqueLectureReportPdfFileName('강의보고서_학교_강사_260108.pdf', used)).toBe(
      '강의보고서_학교_강사_260108_2.pdf'
    )
  })

  it('파일명 금지 문자를 치환한다', () => {
    expect(normalizeLectureReportPdfFileName('강의보고서_A/B:C')).toBe('강의보고서_A_B_C.pdf')
  })
})
