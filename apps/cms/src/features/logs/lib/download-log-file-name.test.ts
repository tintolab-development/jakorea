import { describe, expect, it } from 'vitest'
import { normalizeDownloadLogFileName } from './download-log-file-name'

describe('normalizeDownloadLogFileName', () => {
  it('규칙 적용 전 엑셀 이름을 [JA Korea] CMS 어드민_파일 이름_YYMMDD로 보인다', () => {
    expect(normalizeDownloadLogFileName('교재 목록_20261109.xlsx', 'CLIENT_GENERATED_FILE')).toBe(
      '[JA Korea] CMS 어드민_교재 목록_261109.xlsx'
    )
    expect(
      normalizeDownloadLogFileName('1365_봉사시간_등록_양식_20261109.xlsx', 'CLIENT_GENERATED_FILE')
    ).toBe('[JA Korea] CMS 어드민_1365 봉사시간 등록 양식_261109.xlsx')
    expect(normalizeDownloadLogFileName('강의보고서_일괄_20261109.zip', 'CLIENT_GENERATED_FILE')).toBe(
      '[JA Korea] 강의보고서_일괄_261109.zip'
    )
  })

  it('발급 문서는 [JA Korea] 파일유형명_발급대상자명_YYMMDD.pdf로 보인다', () => {
    expect(normalizeDownloadLogFileName('수료증_한서윤_261110.pdf', 'CERTIFICATE_ISSUE')).toBe(
      '[JA Korea] 수료증_한서윤_261110.pdf'
    )
    expect(
      normalizeDownloadLogFileName('UJAT 교육일지_서울_김민수_261104.pdf', 'CLIENT_GENERATED_FILE')
    ).toBe('[JA Korea] UJAT 교육일지_서울_김민수_261104.pdf')
  })

  it('버그&이슈 표기는 버그,이슈로 맞춘다', () => {
    expect(
      normalizeDownloadLogFileName('[JA Korea] CMS 어드민_버그&이슈 이력_261110.xlsx', 'CLIENT_GENERATED_FILE')
    ).toBe('[JA Korea] CMS 어드민_버그,이슈 이력_261110.xlsx')
  })

  it('사용자가 올린 원본 파일은 그대로 둔다', () => {
    expect(normalizeDownloadLogFileName('IMG_2235.PNG', 'CLIENT_GENERATED_FILE')).toBe('IMG_2235.PNG')
    expect(normalizeDownloadLogFileName('과제_보고서_261110.pdf', 'CLIENT_GENERATED_FILE')).toBe(
      '과제_보고서_261110.pdf'
    )
    expect(normalizeDownloadLogFileName('완료프로그램_학생명단.xlsx', 'PROGRAM')).toBe(
      '완료프로그램_학생명단.xlsx'
    )
  })
})
