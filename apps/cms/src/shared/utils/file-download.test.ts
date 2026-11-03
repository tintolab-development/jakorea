import { describe, expect, it, vi } from 'vitest'
import { fileNameFromContentDisposition } from './file-download'

vi.mock('@/entities/download-log/api/download-log-service', () => ({
  recordFileDownload: vi.fn(),
}))

describe('fileNameFromContentDisposition', () => {
  const fallback = '참여자_과제_홍길동_20261102.zip'

  it('filename*의 UTF-8 이름을 우선한다', () => {
    const header = `attachment; filename="assignment-files-190084-1694714.zip"; filename*=UTF-8''${encodeURIComponent(
      '과제_[모집중_사전교육ㅇ] 2026 JA Korea_홍길동.zip'
    )}`
    expect(fileNameFromContentDisposition(header, fallback)).toBe(
      '과제_[모집중_사전교육ㅇ] 2026 JA Korea_홍길동.zip'
    )
  })

  it('filename*가 없거나 디코딩에 실패하면 ASCII filename', () => {
    expect(
      fileNameFromContentDisposition('attachment; filename="assignment-files-7-1.zip"', fallback)
    ).toBe('assignment-files-7-1.zip')
    expect(
      fileNameFromContentDisposition(
        "attachment; filename=\"assignment-files-7-1.zip\"; filename*=UTF-8''%E0%A4%A",
        fallback
      )
    ).toBe('assignment-files-7-1.zip')
  })

  it('따옴표 없는 filename도 읽는다', () => {
    expect(fileNameFromContentDisposition('attachment; filename=report.xlsx', fallback)).toBe(
      'report.xlsx'
    )
  })

  it('헤더나 파일명이 없으면 fallback', () => {
    expect(fileNameFromContentDisposition(null, fallback)).toBe(fallback)
    expect(fileNameFromContentDisposition(undefined, fallback)).toBe(fallback)
    expect(fileNameFromContentDisposition('attachment', fallback)).toBe(fallback)
  })
})
