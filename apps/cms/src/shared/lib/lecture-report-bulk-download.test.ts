import { describe, expect, it, vi } from 'vitest'
import {
  fileObjectIdFromLectureReportDownloadUrl,
  hasLectureReportZipTargets,
  nonemptyDownloadUrl,
  waitForLectureReportBulkDownloadJob,
} from './lecture-report-bulk-download'

describe('lecture-report-bulk-download', () => {
  it('downloadUrl null과 빈 문자열을 구분하고 둘 다 다운로드 주소로 쓰지 않는다', () => {
    expect(nonemptyDownloadUrl(null)).toBeNull()
    expect(nonemptyDownloadUrl(undefined)).toBeNull()
    expect(nonemptyDownloadUrl('')).toBeNull()
    expect(nonemptyDownloadUrl('   ')).toBeNull()
    expect(nonemptyDownloadUrl('/api/admin/files/2057100/download')).toBe(
      '/api/admin/files/2057100/download'
    )
  })

  it('files download 경로에서 fileObjectId를 읽는다', () => {
    expect(fileObjectIdFromLectureReportDownloadUrl('/api/admin/files/2057100/download')).toBe(
      2057100
    )
    expect(fileObjectIdFromLectureReportDownloadUrl(null)).toBeNull()
    expect(fileObjectIdFromLectureReportDownloadUrl('')).toBeNull()
  })

  it('목록 fileObjectIds가 모두 비면 ZIP 대상이 없다', () => {
    expect(hasLectureReportZipTargets([])).toBe(false)
    expect(hasLectureReportZipTargets([{ fileObjectIds: [] }, { fileObjectIds: [] }])).toBe(false)
    expect(hasLectureReportZipTargets([{ fileObjectIds: [2056526] }])).toBe(true)
    expect(hasLectureReportZipTargets([{ fileObjectIds: [], fileCount: 2 }])).toBe(true)
  })

  it('COMPLETED면 폴링하지 않는다', async () => {
    const fetchJob = vi.fn()
    const ready = await waitForLectureReportBulkDownloadJob(
      {
        status: 'COMPLETED',
        generatedFileJobId: 91,
        fileObjectId: 2057100,
        downloadUrl: '/api/admin/files/2057100/download',
      },
      fetchJob
    )
    expect(fetchJob).not.toHaveBeenCalled()
    expect(ready.fileObjectId).toBe(2057100)
  })

  it('PENDING이면 generatedFileJobId로 폴링하고 완료 파일을 기다린다', async () => {
    const fetchJob = vi
      .fn()
      .mockResolvedValueOnce({ jobStatus: 'PENDING', generatedFileJobId: 91, fileObjectId: null })
      .mockResolvedValueOnce({
        jobStatus: 'COMPLETED',
        generatedFileJobId: 91,
        fileObjectId: 2057100,
      })
    const ready = await waitForLectureReportBulkDownloadJob(
      {
        status: 'PENDING',
        generatedFileJobId: 91,
        fileObjectId: null,
        downloadUrl: null,
      },
      fetchJob,
      0
    )
    expect(fetchJob).toHaveBeenCalledWith(91)
    expect(ready.fileObjectId).toBe(2057100)
  })
})
