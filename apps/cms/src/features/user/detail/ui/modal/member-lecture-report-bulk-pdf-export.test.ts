import { describe, expect, it } from 'vitest'
import type { MemberLectureReportTableRow } from '@/features/user/api/map-member-lecture-reports'
import {
  buildMemberLectureReportPreviewContext,
  filterMemberLectureReportBulkPdfRows,
} from './member-lecture-report-bulk-pdf-export'

function row(overrides: Partial<MemberLectureReportTableRow>): MemberLectureReportTableRow {
  return {
    id: 'row-1',
    reportId: 1,
    educationDateLabel: '26. 11. 10 (화)',
    submissionPeriodLabel: '-',
    lectureProgressLabel: '진행 완료',
    submissionStatusLabel: '제출 완료',
    canViewReport: false,
    ...overrides,
  } as MemberLectureReportTableRow
}

describe('filterMemberLectureReportBulkPdfRows', () => {
  it('제출 완료이고 보고서 id가 있는 행만 본문 PDF 대상으로 고른다', () => {
    const rows = [
      row({ id: 'a', reportId: 11, submissionStatusLabel: '제출 완료' }),
      row({ id: 'b', reportId: 12, submissionStatusLabel: '미제출' }),
      row({ id: 'c', reportId: 13, submissionStatusLabel: '예외 승인' }),
      row({ id: 'd', reportId: undefined, submissionStatusLabel: '제출 완료' }),
      row({ id: 'e', reportId: 15, submissionStatusLabel: '진행 예정' }),
    ]
    expect(filterMemberLectureReportBulkPdfRows(rows).map(item => item.id)).toEqual(['a'])
  })

  it('첨부 없이 제출한 보고서(canViewReport=false)도 본문 PDF 대상이다', () => {
    const rows = [row({ id: 'a', reportId: 11, canViewReport: false, reportFileIds: [] })]
    expect(filterMemberLectureReportBulkPdfRows(rows)).toHaveLength(1)
  })
})

describe('buildMemberLectureReportPreviewContext', () => {
  it('미리보기와 일괄 PDF가 같은 번호·프로그램명·강사명을 쓴다', () => {
    const rows = [row({ id: 'a', reportId: 11 }), row({ id: 'b', reportId: 12 })]
    const context = buildMemberLectureReportPreviewContext({
      row: rows[1],
      rows,
      content: {} as never,
      instructorName: '  김강사 ',
      programTitle: '경제교육',
    })
    expect(context.row.no).toBe(2)
    expect(context.row.reportId).toBe(12)
    expect(context.program?.mainTitle).toBe('경제교육')
    expect(context.instructor.instructorName).toBe('김강사')
  })

  it('강사명이 없으면 하이픈을 쓴다', () => {
    const rows = [row({ id: 'a' })]
    const context = buildMemberLectureReportPreviewContext({
      row: rows[0],
      rows,
      content: {} as never,
      programTitle: '프로그램',
    })
    expect(context.instructor.instructorName).toBe('-')
  })
})
