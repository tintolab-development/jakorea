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

  it('참여학생명단 샘플 양식 — 오전 9시 전에도 서울 날짜(예전 UTC 날짜 버그 방지)', async () => {
    const { generateFilename } = await import('./file-download')
    expect(generateFilename('참여학생명단 샘플', 'xlsx', new Date('2026-11-09T23:30:00Z'))).toBe(
      '[JA Korea] CMS 어드민_참여학생명단 샘플_261110.xlsx'
    )
  })

  it('pdf·zip은 도메인 없이 [JA Korea] 파일 이름_YYMMDD', async () => {
    const { generateFilename } = await import('./file-download')
    expect(generateFilename('강의보고서_일괄', 'zip', new Date('2026-11-10T03:00:00Z'))).toBe(
      '[JA Korea] 강의보고서_일괄_261110.zip'
    )
  })
})

describe('ruleFileNameFromContentDisposition', () => {
  it('서버 이름이 [JA Korea] 규칙이면 그대로 쓴다', async () => {
    const { ruleFileNameFromContentDisposition } = await import('./file-download')
    expect(
      ruleFileNameFromContentDisposition(
        "attachment; filename*=UTF-8''%5BJA%20Korea%5D%20CMS%20%EC%96%B4%EB%93%9C%EB%AF%BC_%EC%8B%A4%EC%A0%81_261110.xlsx",
        'fallback.xlsx'
      )
    ).toBe('[JA Korea] CMS 어드민_실적_261110.xlsx')
  })

  it('영문 이름이거나 헤더가 없으면 규칙 이름(fallback)을 쓴다', async () => {
    const { ruleFileNameFromContentDisposition } = await import('./file-download')
    const fallback = '[JA Korea] CMS 어드민_실적데이터_261110.xlsx'
    expect(
      ruleFileNameFromContentDisposition('attachment; filename="performance_all_pall_v3.xlsx"', fallback)
    ).toBe(fallback)
    expect(ruleFileNameFromContentDisposition(undefined, fallback)).toBe(fallback)
  })
})

describe('toRuleDownloadFileName', () => {
  it('업로드 원본은 [JA Korea] {원본}_YYMMDD.확장자 (서울 날짜)', async () => {
    const { toRuleDownloadFileName } = await import('./file-download')
    const d = new Date('2026-11-09T23:30:00Z')
    expect(toRuleDownloadFileName('IMG_2235.PNG', d)).toBe('[JA Korea] IMG_2235_261110.PNG')
    expect(toRuleDownloadFileName('과제/보고서.txt', d)).toBe('[JA Korea] 과제,보고서_261110.txt')
    expect(toRuleDownloadFileName('확장자없음', d)).toBe('[JA Korea] 확장자없음_261110')
  })

  it('이미 규칙 이름이면 그대로 둔다(중복 적용 안전)', async () => {
    const { toRuleDownloadFileName } = await import('./file-download')
    const once = toRuleDownloadFileName('IMG_2235.PNG')
    expect(toRuleDownloadFileName(once)).toBe(once)
    expect(toRuleDownloadFileName('[JA Korea] CMS 어드민_교재 목록_261110.xlsx')).toBe(
      '[JA Korea] CMS 어드민_교재 목록_261110.xlsx'
    )
  })
})
