import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MemberLectureReportTableRow } from '@/features/user/api/map-member-lecture-reports'

const fetchContent = vi.fn()

vi.mock('@/features/program/general/api/admin-program-progress-service', () => ({
  fetchLectureReportPreviewContentByReportId: (reportId: number) => fetchContent(reportId),
}))

const { resolveMemberLectureReportFiles } = await import(
  '@/features/user/api/resolve-member-lecture-report-files'
)

function row(overrides: Partial<MemberLectureReportTableRow> = {}): MemberLectureReportTableRow {
  return {
    id: '10',
    reportId: 77,
    educationDateLabel: '2026.11.14(토) | 2회차',
    submissionPeriodLabel: '2026.11.18(수)까지',
    lectureProgressLabel: '진행 완료',
    submissionStatusLabel: '제출 완료',
    canViewReport: true,
    reportFileIds: [501],
    ...overrides,
  }
}

describe('resolveMemberLectureReportFiles', () => {
  beforeEach(() => {
    fetchContent.mockReset()
  })

  it('목록 id(sourceId일 수 있음) 대신 보고서 본문이 준 fileObjectId를 쓴다', async () => {
    fetchContent.mockResolvedValue({
      files: [{ fileObjectId: 9001, originalFileName: '강의보고서.pdf' }],
    })

    await expect(resolveMemberLectureReportFiles(row())).resolves.toEqual([
      { fileObjectId: 9001, originalFileName: '강의보고서.pdf' },
    ])
    expect(fetchContent).toHaveBeenCalledWith(77)
  })

  it('보고서 id가 없으면 본문을 부르지 않고 목록 id로 되돌아간다', async () => {
    await expect(
      resolveMemberLectureReportFiles(row({ reportId: undefined, reportFileIds: [501, 502] }))
    ).resolves.toEqual([{ fileObjectId: 501 }, { fileObjectId: 502 }])
    expect(fetchContent).not.toHaveBeenCalled()
  })

  it('본문에 내려받을 첨부가 없으면 목록 id로 되돌아간다', async () => {
    fetchContent.mockResolvedValue({ files: [] })

    await expect(resolveMemberLectureReportFiles(row())).resolves.toEqual([{ fileObjectId: 501 }])
  })

  it('본문 조회가 실패하면 엉뚱한 파일을 받지 않고 오류를 그대로 올린다', async () => {
    fetchContent.mockRejectedValue(new Error('403'))

    await expect(resolveMemberLectureReportFiles(row())).rejects.toThrow('403')
  })
})
