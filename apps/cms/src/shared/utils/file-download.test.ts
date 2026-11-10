import { describe, expect, it, vi } from 'vitest'
import { fileNameFromContentDisposition, sanitizeDownloadFileName } from './file-download'

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

describe('sanitizeDownloadFileName', () => {
  it('/를 ,로 바꾸고 한글은 유지한다', () => {
    expect(sanitizeDownloadFileName('버그/이슈 관리')).toBe('버그,이슈 관리')
    expect(sanitizeDownloadFileName('[JA Korea] CMS 어드민_버그/이슈 이력_261110.xlsx')).toBe(
      '[JA Korea] CMS 어드민_버그,이슈 이력_261110.xlsx'
    )
  })

  it('Content-Disposition 파일명에도 적용한다', () => {
    const header = `attachment; filename*=UTF-8''${encodeURIComponent('버그/이슈 이력.xlsx')}`
    expect(fileNameFromContentDisposition(header, 'x.xlsx')).toBe('버그,이슈 이력.xlsx')
  })
})

describe('generateFilename', () => {
  it('xlsx는 [JA Korea] CMS 어드민_파일 이름_YYMMDD (서울 기준)', async () => {
    const { generateFilename } = await import('./file-download')
    // 2026-11-10 08:00 KST = 2026-11-09 23:00 UTC
    expect(generateFilename('교재 목록', 'xlsx', new Date('2026-11-09T23:00:00Z'))).toBe(
      '[JA Korea] CMS 어드민_교재 목록_261110.xlsx'
    )
  })

  it('pdf·zip은 도메인 없이 [JA Korea] 파일 이름_YYMMDD', async () => {
    const { generateFilename } = await import('./file-download')
    expect(generateFilename('강의보고서_일괄', 'zip', new Date('2026-11-10T03:00:00Z'))).toBe(
      '[JA Korea] 강의보고서_일괄_261110.zip'
    )
  })
})
